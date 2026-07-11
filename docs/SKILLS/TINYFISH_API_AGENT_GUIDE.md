---
name: tinyfish-api-agent-guide
description: Playbook để AI agent tự chọn và gọi TinyFish Agent, Search, Fetch hoặc Browser API an toàn, có cấu trúc và có khả năng phục hồi lỗi.
last_verified: 2026-07-11
language: vi
---

# TinyFish API — hướng dẫn cho AI Agent

## 1. Mục tiêu

Dùng tài liệu này như **system instruction / skill file** cho một AI agent cần truy cập web qua TinyFish.

Agent phải:

1. Chọn đúng API surface trước khi gọi.
2. Không đưa API key vào prompt, log, URL hoặc output cho người dùng.
3. Ưu tiên output JSON có schema khi kết quả được dùng cho bước xử lý tiếp theo.
4. Phân biệt lỗi HTTP với lỗi của chính automation run.
5. Kiểm tra kết quả về mặt ngữ nghĩa, không chỉ kiểm tra trạng thái `COMPLETED`.

## 2. Bốn API surface

| Nhu cầu | API nên dùng | Endpoint chính |
|---|---|---|
| Tìm URL, tin tức, paper hoặc kết quả tìm kiếm có xếp hạng | Search | `GET https://api.search.tinyfish.ai` |
| Đã biết URL và chỉ cần nội dung trang sạch | Fetch | `POST https://api.fetch.tinyfish.ai` |
| Cần AI tự click, nhập liệu, điều hướng và trích xuất | Agent | `POST https://agent.tinyfish.ai/v1/automation/...` |
| Cần tự điều khiển Playwright/CDP ở mức thấp | Browser | `POST https://api.browser.tinyfish.ai` |

### Quy tắc lựa chọn

```text
Nếu chỉ cần tìm nguồn -> Search.
Nếu đã có URL và chỉ cần đọc nội dung -> Fetch.
Nếu phải thao tác trên website -> Agent.
Nếu code của ứng dụng phải tự điều khiển browser -> Browser.
```

Không dùng Agent cho một việc Fetch có thể giải quyết. Điều này làm tăng độ trễ, độ phức tạp và chi phí.

## 3. Xác thực

Biến môi trường:

```bash
TINYFISH_API_KEY=your_api_key_here
```

Tất cả REST request dùng header:

```http
X-API-Key: <TINYFISH_API_KEY>
```

Không truyền key bằng query string.

## 4. Cài SDK

### TypeScript

```bash
npm install @tiny-fish/sdk@latest
```

```ts
import { TinyFish } from "@tiny-fish/sdk";

const tinyfish = new TinyFish(); // tự đọc TINYFISH_API_KEY
```

### Python

```bash
pip install -U tinyfish
```

```py
from tinyfish import TinyFish

client = TinyFish()  # tự đọc TINYFISH_API_KEY
```

SDK nên được ưu tiên vì đã xử lý auth, kiểu dữ liệu và SSE tốt hơn raw HTTP.

---

# 5. Tool contract đề xuất cho AI Agent

Nên expose TinyFish thành nhiều tool nhỏ thay vì một tool tổng quát. Điều này giúp model chọn đúng hành động và giảm payload sai.

## 5.1 `tinyfish_search`

```json
{
  "name": "tinyfish_search",
  "description": "Tìm kiếm web, news hoặc research papers và trả về title, snippet, URL. Không dùng để thao tác website.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "purpose": { "type": "string" },
      "location": { "type": "string" },
      "language": { "type": "string" },
      "domain_type": {
        "type": "string",
        "enum": ["web", "news", "research_paper"]
      },
      "recency_minutes": { "type": "integer", "minimum": 1, "maximum": 5256000 },
      "after_date": { "type": "string", "description": "YYYY-MM-DD" },
      "before_date": { "type": "string", "description": "YYYY-MM-DD" }
    },
    "required": ["query"]
  }
}
```

Quy tắc validate:

- Không kết hợp `recency_minutes` với `after_date` hoặc `before_date`.
- `after_date <= before_date`.
- Không dùng date/recency filter khi `domain_type = research_paper`.
- Dùng `purpose` để nói rõ mục tiêu tìm kiếm, không nhồi toàn bộ prompt người dùng vào `query`.

## 5.2 `tinyfish_fetch`

```json
{
  "name": "tinyfish_fetch",
  "description": "Lấy nội dung sạch từ tối đa 10 URL đã biết. Dùng markdown cho LLM, json cho pipeline dữ liệu.",
  "parameters": {
    "type": "object",
    "properties": {
      "urls": {
        "type": "array",
        "items": { "type": "string", "format": "uri" },
        "minItems": 1,
        "maxItems": 10
      },
      "format": { "type": "string", "enum": ["markdown", "html", "json"] },
      "links": { "type": "boolean" },
      "image_links": { "type": "boolean" },
      "ttl": { "type": "integer", "minimum": 0 },
      "per_url_timeout_ms": { "type": "integer", "minimum": 1, "maximum": 110000 }
    },
    "required": ["urls"]
  }
}
```

Quy tắc:

- Mặc định `format = markdown`.
- Bỏ `ttl` nếu chấp nhận cache mặc định.
- `ttl = 0` khi bắt buộc lấy dữ liệu live.
- Chặn URL localhost, private IP, metadata endpoint và URL không phải HTTP/HTTPS trước khi gọi.
- Kết quả batch có thể vừa có `results[]` vừa có `errors[]`; xử lý lỗi theo từng URL.

## 5.3 `tinyfish_agent_run`

```json
{
  "name": "tinyfish_agent_run",
  "description": "Cho TinyFish tự thao tác trên website theo goal. Chỉ dùng khi cần click, nhập liệu, điều hướng hoặc workflow nhiều bước.",
  "parameters": {
    "type": "object",
    "properties": {
      "url": { "type": "string", "format": "uri" },
      "goal": { "type": "string" },
      "execution_mode": {
        "type": "string",
        "enum": ["sync", "async", "sse"]
      },
      "output_schema": { "type": "object" },
      "browser_profile": { "type": "string", "enum": ["lite", "stealth"] },
      "use_profile": { "type": "boolean" },
      "profile_id": { "type": "string" },
      "use_vault": { "type": "boolean" }
    },
    "required": ["url", "goal"]
  }
}
```

Mặc định:

- `execution_mode = sse` cho ứng dụng cần progress.
- `sync` cho tác vụ ngắn và backend đơn giản.
- `async` cho batch, job dài hoặc workflow có queue.
- `browser_profile = lite`; chỉ chuyển sang `stealth` khi site có bot protection hợp pháp và người dùng được phép truy cập.

---

# 6. Search API

## SDK TypeScript

```ts
import { TinyFish } from "@tiny-fish/sdk";

const client = new TinyFish();

const response = await client.search.query({
  query: "AI agent observability tools",
  purpose: "Compare current observability platforms for an engineering report",
  location: "US",
  language: "en",
  domain_type: "web",
});

for (const item of response.results) {
  console.log(item.title, item.url, item.snippet);
}
```

## Raw HTTP

```bash
curl --get "https://api.search.tinyfish.ai" \
  -H "X-API-Key: $TINYFISH_API_KEY" \
  --data-urlencode "query=AI agent observability tools" \
  --data-urlencode "purpose=Compare platforms for an engineering report" \
  --data-urlencode "location=US" \
  --data-urlencode "language=en"
```

## Khi agent nhận kết quả Search

Agent phải:

1. Loại kết quả không liên quan.
2. Không coi snippet là bằng chứng đầy đủ; dùng Fetch để đọc nguồn quan trọng.
3. Giữ URL nguồn trong dữ liệu trung gian để trace được provenance.
4. Với câu hỏi “mới nhất”, dùng `domain_type=news` và filter thời gian phù hợp.

---

# 7. Fetch API

## SDK TypeScript

```ts
import { TinyFish } from "@tiny-fish/sdk";

const client = new TinyFish();

const response = await client.fetch.getContents({
  urls: ["https://example.com/docs"],
  format: "markdown",
  links: true,
  ttl: 0,
  per_url_timeout_ms: 45_000,
});

for (const page of response.results) {
  console.log(page.title);
  console.log(page.text);
}

for (const error of response.errors ?? []) {
  console.error("Fetch failed:", error);
}
```

## Raw HTTP

```bash
curl -X POST "https://api.fetch.tinyfish.ai" \
  -H "X-API-Key: $TINYFISH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com/docs"],
    "format": "markdown",
    "links": true,
    "ttl": 0,
    "per_url_timeout_ms": 45000
  }'
```

## Chính sách batch

- Tối đa 10 URL/request.
- Không retry cả batch nếu chỉ một URL lỗi.
- Retry riêng URL lỗi do timeout hoặc lỗi tạm thời.
- Không retry `400`, URL không hợp lệ hoặc URL bị chặn bởi chính sách SSRF.
- Client timeout nên ít nhất 150 giây cho batch nặng.

---

# 8. Agent API

## 8.1 Viết `goal` tốt

Goal phải chứa:

1. **Đích đến:** trang hoặc flow cần thao tác.
2. **Hành động:** click, lọc, điền, điều hướng hoặc trích xuất.
3. **Điều kiện:** giới hạn số lượng, cách xử lý thiếu dữ liệu, tiêu chí dừng.
4. **Định dạng output:** JSON và tên field.
5. **Ràng buộc an toàn:** không submit, mua hàng, xoá hoặc thay đổi dữ liệu nếu chưa được phép.

Ví dụ tốt:

```text
Trên trang sản phẩm, lấy 5 sản phẩm đầu tiên đang còn hàng.
Với mỗi sản phẩm, trả về name, price, currency và product_url.
Nếu không thấy trạng thái còn hàng, đặt in_stock = null.
Không đăng nhập, không thêm vào giỏ và không thực hiện giao dịch.
Chỉ trả về JSON đúng theo output schema.
```

Ví dụ không tốt:

```text
Lấy dữ liệu giúp tôi.
```

## 8.2 Output schema

```json
{
  "type": "object",
  "properties": {
    "products": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "price": { "type": "number" },
          "currency": { "type": "string" },
          "product_url": { "type": "string" },
          "in_stock": { "type": "boolean", "nullable": true }
        },
        "required": ["name", "product_url"]
      }
    }
  },
  "required": ["products"]
}
```

Giữ schema đơn giản. Các giới hạn quan trọng của TinyFish `output_schema`:

- Top-level phải là `type: "object"`.
- Dùng `nullable: true`, không dùng `type: ["string", "null"]`.
- Dùng `anyOf`, không dùng `oneOf`.
- Không dùng `additionalProperties`, `const`, `example` hoặc keyword ngoài allowlist.
- Schema tối đa 64 KB và độ sâu tối đa 10.
- Nếu cần danh sách, đặt danh sách trong một field array của object top-level.

## 8.3 Streaming bằng SDK

```ts
import { TinyFish } from "@tiny-fish/sdk";

const client = new TinyFish();

const stream = await client.agent.stream({
  url: "https://scrapeme.live/shop",
  goal: "Extract the first 2 product names and prices. Return JSON.",
  output_schema: {
    type: "object",
    properties: {
      products: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            price: { type: "string" }
          },
          required: ["name", "price"]
        }
      }
    },
    required: ["products"]
  }
});

let runId: string | undefined;

for await (const event of stream) {
  if (event.type === "STARTED") runId = event.run_id;
  if (event.type === "PROGRESS") console.log(event.purpose);

  if (event.type === "COMPLETE") {
    if (event.status !== "COMPLETED") {
      throw new Error(JSON.stringify(event.error));
    }
    console.log(event.result);
  }
}
```

## 8.4 Raw SSE

```bash
curl -N -X POST "https://agent.tinyfish.ai/v1/automation/run-sse" \
  -H "X-API-Key: $TINYFISH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://scrapeme.live/shop",
    "goal": "Extract the first 2 product names and prices. Return JSON."
  }'
```

SSE event có thể gồm:

- `STARTED`
- `STREAMING_URL`
- `PROGRESS`
- `HEARTBEAT`
- `COMPLETE`

SSE không hỗ trợ reconnect bằng `Last-Event-ID`. Nếu kết nối đứt sau khi đã có `run_id`, poll:

```http
GET https://agent.tinyfish.ai/v1/runs/{run_id}
```

cho đến khi trạng thái là:

```text
COMPLETED | FAILED | CANCELLED
```

## 8.5 Async flow

### Start

```bash
curl -X POST "https://agent.tinyfish.ai/v1/automation/run-async" \
  -H "X-API-Key: $TINYFISH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "goal": "Extract the current pricing table as JSON."
  }'
```

### Poll

```bash
curl "https://agent.tinyfish.ai/v1/runs/RUN_ID" \
  -H "X-API-Key: $TINYFISH_API_KEY"
```

### Cancel

```bash
curl -X POST "https://agent.tinyfish.ai/v1/runs/RUN_ID/cancel" \
  -H "X-API-Key: $TINYFISH_API_KEY"
```

Không thể cancel run tạo bằng endpoint sync `/run`.

---

# 9. Thuật toán tự gọi API

```text
INPUT: yêu cầu người dùng

1. Xác định tác vụ chỉ đọc hay có thay đổi trạng thái bên ngoài.
2. Nếu có hành động gây thay đổi dữ liệu, giao dịch, submit form hoặc gửi tin:
   - chỉ tiếp tục khi người dùng đã cho phép rõ ràng;
   - thêm ràng buộc vào goal;
   - yêu cầu human confirmation trước bước không thể hoàn tác.
3. Chọn Search / Fetch / Agent / Browser.
4. Validate URL, ngày tháng, domain_type và schema.
5. Gọi API với timeout phù hợp.
6. Nếu 429 hoặc lỗi tạm thời:
   - dùng Retry-After nếu có;
   - exponential backoff + jitter;
   - tối đa 3 lần.
7. Nếu run Agent hoàn tất:
   - kiểm tra status;
   - kiểm tra error;
   - kiểm tra output có dấu hiệu captcha, blocked, access denied hoặc dữ liệu thiếu;
   - validate output theo schema lần nữa ở phía client.
8. Trả dữ liệu đã chuẩn hoá, kèm nguồn URL và trạng thái độ tin cậy.
```

---

# 10. Xử lý lỗi

TinyFish có hai lớp lỗi:

## 10.1 Lỗi HTTP/API

| HTTP | Ví dụ code | Cách xử lý |
|---|---|---|
| 400 | `INVALID_INPUT` | Sửa payload, không retry y nguyên |
| 401 | `MISSING_API_KEY`, `INVALID_API_KEY` | Kiểm tra secret/config |
| 403 | `FORBIDDEN` | Kiểm tra quyền hoặc tính năng account-gated |
| 429 | `RATE_LIMIT_EXCEEDED` | Backoff, tôn trọng retry delay |
| 500 | `INTERNAL_ERROR` | Retry giới hạn, sau đó báo lỗi |

## 10.2 Lỗi nằm trong run dù HTTP là 200

Ví dụ:

- `SERVICE_BUSY`
- `TIMEOUT`
- `INSUFFICIENT_CREDITS`
- `CONTENT_POLICY_VIOLATION`
- `MAX_STEPS_EXCEEDED`
- `SITE_BLOCKED`
- `TASK_FAILED`
- `CANCELLED`

Không coi HTTP 200 là thành công cuối cùng.

## 10.3 Hàm retry TypeScript

```ts
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxAttempts = 3,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, init);
      if (!RETRYABLE_STATUS.has(response.status) || attempt === maxAttempts) {
        return response;
      }

      const retryAfter = Number(response.headers.get("retry-after"));
      const delayMs = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : Math.min(1000 * 2 ** (attempt - 1), 8000) + Math.random() * 250;

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(1000 * 2 ** (attempt - 1), 8000)),
      );
    }
  }

  throw lastError ?? new Error("TinyFish request failed");
}
```

---

# 11. Bảo mật và giới hạn hành động

Agent không được:

- In hoặc gửi `TINYFISH_API_KEY` cho model hay người dùng.
- Dùng TinyFish để vượt quyền truy cập, captcha, paywall hoặc cơ chế bảo vệ trái phép.
- Đăng nhập bằng credential không thuộc quyền sử dụng của người dùng.
- Submit đơn hàng, thanh toán, xoá dữ liệu hoặc gửi form nhạy cảm khi chưa có xác nhận.
- Fetch URL nội bộ, private IP hoặc cloud metadata.

Nên:

- Dùng Browser Context Profile cho phiên đăng nhập lặp lại.
- Dùng Vault thay vì nhúng username/password vào goal.
- Ghi audit log gồm `run_id`, target domain, action class và outcome; không ghi secret.

---

# 12. Checklist trước khi production

- [ ] API key chỉ nằm ở secret manager hoặc environment.
- [ ] Có timeout riêng cho Search, Fetch và Agent.
- [ ] Có retry giới hạn cho lỗi tạm thời.
- [ ] Có validation URL chống SSRF.
- [ ] Có schema validation cho output.
- [ ] Có fallback poll khi SSE disconnect.
- [ ] Có semantic success check sau `COMPLETED`.
- [ ] Có human approval cho hành động thay đổi dữ liệu.
- [ ] Có log `run_id` nhưng không log credential.
- [ ] Có test cho 400, 401, 429, timeout, site blocked và output thiếu field.

---

# 13. Tài liệu chính thức

- https://docs.tinyfish.ai/for-coding-agents
- https://docs.tinyfish.ai/agent-api/reference
- https://docs.tinyfish.ai/search-api
- https://docs.tinyfish.ai/fetch-api/reference
- https://docs.tinyfish.ai/error-codes
- https://docs.tinyfish.ai/authentication

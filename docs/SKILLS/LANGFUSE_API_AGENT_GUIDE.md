---
name: langfuse-api-agent-guide
description: Playbook để AI agent tự ghi trace, lấy prompt, gửi score và truy vấn observability data qua Langfuse SDK/Public API.
last_verified: 2026-07-11
language: vi
---

# Langfuse API — hướng dẫn cho AI Agent

## 1. Hiểu đúng vai trò của Langfuse

Langfuse chủ yếu là nền tảng **observability, prompt management và evaluation** cho LLM/agent.

Không nên thiết kế việc ghi trace như một tool mà model phải “nhớ gọi”. Trace phải được cài ở middleware/runtime để tự động ghi cả khi model lỗi.

Tách thành hai nhóm:

### Nhóm A — tự động, không cần model quyết định

- Ghi trace/span/generation.
- Ghi input/output đã mask.
- Ghi tool call, latency, model, token, cost và lỗi.
- Gắn `userId`, `sessionId`, tags, release và environment.

### Nhóm B — có thể expose thành tool cho agent

- Lấy prompt/version/config.
- Query observations/metrics.
- Tạo score/evaluation khi workflow yêu cầu.
- Quản lý dataset hoặc prompt trong agent quản trị có quyền phù hợp.

## 2. Credentials và base URL

```bash
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

Cloud regions thường gặp:

```text
EU:    https://cloud.langfuse.com
US:    https://us.cloud.langfuse.com
Japan: https://jp.cloud.langfuse.com
HIPAA: https://hipaa.cloud.langfuse.com
```

Self-hosted:

```bash
LANGFUSE_BASE_URL=https://langfuse.example.com
```

Project Public API dùng HTTP Basic Auth:

```text
username = LANGFUSE_PUBLIC_KEY
password = LANGFUSE_SECRET_KEY
```

Không nhầm public key trong tên gọi với một credential an toàn để public hoàn toàn. Cặp public + secret xác thực project; secret luôn phải được bảo vệ.

---

# 3. Package hiện hành

## Tracing JS/TS

```bash
npm install @langfuse/tracing @langfuse/otel @opentelemetry/sdk-node
```

## Public API và Prompt Management JS/TS

```bash
npm install @langfuse/client
```

## Python

```bash
pip install langfuse
```

SDK hiện hành được tài liệu chính thức khuyến nghị:

- Python SDK v4
- JS/TS SDK v5

Tránh copy code legacy từ SDK major cũ nếu không kiểm tra migration guide.

---

# 4. Khởi tạo tracing trong Node.js

Tạo `instrumentation.ts`:

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";

export const telemetrySdk = new NodeSDK({
  spanProcessors: [new LangfuseSpanProcessor()],
});

telemetrySdk.start();
```

Import file này trước các module cần trace:

```ts
import "./instrumentation"; // phải là import đầu tiên
import { runAgent } from "./agent";

await runAgent();
```

Với CLI, test runner hoặc serverless process kết thúc nhanh, shutdown/flush telemetry trước khi process exit:

```ts
import { telemetrySdk } from "./instrumentation";

try {
  // application logic
} finally {
  await telemetrySdk.shutdown();
}
```

Không để lỗi telemetry làm hỏng luồng nghiệp vụ chính.

---

# 5. Trace một agent workflow

## 5.1 Context-based tracing

```ts
import {
  startActiveObservation,
  startObservation,
} from "@langfuse/tracing";

export async function executeAgent(userQuery: string) {
  return startActiveObservation("agent-request", async (rootSpan) => {
    rootSpan.update({
      input: { userQuery },
      metadata: {
        component: "customer-support-agent",
        environment: process.env.NODE_ENV ?? "development",
      },
    });

    const retrieval = startObservation(
      "retrieve-context",
      { input: { query: userQuery } },
      { asType: "retriever" },
    );

    const documents = await retrieveDocuments(userQuery);
    retrieval.update({
      output: { documentCount: documents.length },
    }).end();

    const generation = startObservation(
      "llm-answer",
      {
        model: "your-model-name",
        input: [{ role: "user", content: userQuery }],
      },
      { asType: "generation" },
    );

    try {
      const answer = await callModel(userQuery, documents);
      generation.update({ output: { content: answer } }).end();
      rootSpan.update({ output: { answer } });
      return answer;
    } catch (error) {
      generation.update({
        level: "ERROR",
        statusMessage: error instanceof Error ? error.message : String(error),
      }).end();
      throw error;
    }
  });
}
```

`retrieveDocuments` và `callModel` là hàm của ứng dụng.

## 5.2 Dùng `observe()` cho function

```ts
import { observe, updateActiveObservation } from "@langfuse/tracing";

async function fetchCustomer(customerId: string) {
  updateActiveObservation({
    metadata: { source: "customer-api" },
  });

  return { customerId, tier: "gold" };
}

export const tracedFetchCustomer = observe(fetchCustomer, {
  name: "fetch-customer",
  asType: "span",
});
```

Không capture raw input/output nếu chứa PII hoặc payload quá lớn.

---

# 6. Dữ liệu nên ghi cho agent

Mỗi request nên có:

```text
trace/observation name
userId đã pseudonymize
sessionId
agent name + version
release/commit SHA
environment
input đã mask
output đã mask
tool name + tool arguments đã lọc secret
tool result summary
model + model parameters
usage/cost nếu có
latency và time-to-first-token
retry count
error level + statusMessage
prompt name + prompt version
```

Gợi ý naming:

```text
agent-request
planner
retrieve-context
tool:tinyfish-search
tool:apify-run-actor
llm-generation
output-validation
```

Không dùng tên span chứa user input động, vì sẽ tạo cardinality cao.

---

# 7. Prompt Management

## 7.1 Lấy prompt bằng JS/TS SDK

```ts
import { LangfuseClient } from "@langfuse/client";

const langfuse = new LangfuseClient();

const prompt = await langfuse.prompt.get("customer-support-agent", {
  label: "production",
});

const compiled = prompt.compile({
  company_name: "Example Corp",
  policy_summary: "Refund within 30 days",
});

console.log(compiled);
console.log(prompt.config);
```

Biến prompt dùng cú pháp:

```text
{{variable_name}}
```

Nếu không chỉ định version/label, Langfuse thường phục vụ version có label `production`.

Các label hữu ích:

- `production`
- `staging`
- `latest`

Không dùng `latest` mặc định trong production nếu cần rollback ổn định.

## 7.2 Tool contract `langfuse_get_prompt`

```json
{
  "name": "langfuse_get_prompt",
  "description": "Lấy prompt có version từ Langfuse. Chỉ dùng prompt thuộc project hiện tại.",
  "parameters": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "label": { "type": "string" },
      "version": { "type": "integer", "minimum": 1 },
      "variables": { "type": "object" }
    },
    "required": ["name"]
  }
}
```

Validate:

- Không gửi đồng thời `label` và `version` nếu SDK/flow của bạn không định nghĩa precedence rõ ràng.
- Kiểm tra đủ variable trước khi compile.
- Không cho model sửa prompt production trực tiếp nếu không có approval workflow.

---

# 8. Query Public API

## 8.1 Basic Auth helper

```ts
function langfuseBasicAuth(): string {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;

  if (!publicKey || !secretKey) {
    throw new Error("Missing Langfuse credentials");
  }

  return `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`;
}
```

## 8.2 Query Observations API v2

```ts
const baseUrl = process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com";

const params = new URLSearchParams({
  fromStartTime: "2026-07-10T00:00:00Z",
  toStartTime: "2026-07-11T00:00:00Z",
  fields: "core,basic,usage,metrics",
  limit: "100",
});

const response = await fetch(
  `${baseUrl}/api/public/v2/observations?${params}`,
  {
    headers: {
      Authorization: langfuseBasicAuth(),
      Accept: "application/json",
    },
  },
);

if (!response.ok) {
  throw new Error(`Langfuse API ${response.status}: ${await response.text()}`);
}

const page = await response.json();
console.log(page.data);
console.log("next cursor:", page.meta?.cursor);
```

Observations API v2 nên luôn có khoảng thời gian giới hạn:

```text
fromStartTime + toStartTime
```

Field groups:

| Group | Dữ liệu |
|---|---|
| `core` | id, traceId, start/end, type, parent |
| `basic` | name, level, status, userId, sessionId, environment |
| `time` | createdAt, updatedAt, completionStartTime |
| `io` | input, output |
| `metadata` | metadata |
| `model` | model và parameters |
| `usage` | token/usage/cost |
| `prompt` | prompt id/name/version |
| `metrics` | latency, timeToFirstToken |
| `trace_context` | tags, release, traceName |

Chỉ yêu cầu `io` khi thật sự cần vì có thể lớn và nhạy cảm.

## 8.3 Cursor pagination

```ts
async function* iterateObservations(params: Record<string, string>) {
  const baseUrl = process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com";
  let cursor: string | undefined;

  do {
    const query = new URLSearchParams({ ...params, limit: "250" });
    if (cursor) query.set("cursor", cursor);

    const response = await fetch(
      `${baseUrl}/api/public/v2/observations?${query}`,
      { headers: { Authorization: langfuseBasicAuth() } },
    );

    if (!response.ok) {
      throw new Error(`Langfuse query failed: ${response.status}`);
    }

    const page = await response.json();
    for (const item of page.data ?? []) yield item;
    cursor = page.meta?.cursor ?? undefined;
  } while (cursor);
}
```

Không dùng offset pagination cho v2 Observations API.

## 8.4 SDK client cho query

```ts
import { LangfuseClient } from "@langfuse/client";

const langfuse = new LangfuseClient();

const observations = await langfuse.api.observations.getMany({
  traceId: "trace-id",
  fields: "core,basic,usage",
  limit: 100,
});

console.log(observations);
```

Từ JS/TS SDK v5, namespace v2 chính là:

```text
api.observations
api.scores
api.metrics
```

Không dùng alias cũ như `observationsV2` trong code mới.

---

# 9. Tool contract query observability

```json
{
  "name": "langfuse_query_observations",
  "description": "Truy vấn observation của project Langfuse hiện tại trong một time window có giới hạn.",
  "parameters": {
    "type": "object",
    "properties": {
      "from_start_time": { "type": "string", "description": "ISO 8601" },
      "to_start_time": { "type": "string", "description": "ISO 8601" },
      "trace_id": { "type": "string" },
      "fields": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["core", "basic", "time", "io", "metadata", "model", "usage", "prompt", "metrics", "trace_context"]
        }
      },
      "limit": { "type": "integer", "minimum": 1, "maximum": 1000 }
    },
    "required": ["from_start_time", "to_start_time"]
  }
}
```

Policy:

- Mặc định không include `io`.
- Giới hạn time window theo use case.
- Không expose trace của user khác nếu agent không có quyền.
- Redact PII trước khi đưa query result vào LLM context.

---

# 10. Scores và evaluation

Agent có thể gửi score sau khi có kết quả đánh giá, ví dụ:

```text
correctness
faithfulness
tool_success
human_feedback
policy_compliance
```

Score phải liên kết với trace/observation ID ổn định. Không tự tạo “điểm chất lượng” không có rubric.

Rubric tối thiểu:

```text
metric name
type: numeric/categorical/boolean/text
range hoặc allowed labels
definition
source: deterministic, LLM judge hay human
judge model/version nếu dùng LLM
```

Không dùng cùng một metric name cho hai rubric khác nhau.

---

# 11. Mask dữ liệu nhạy cảm

Không ghi:

- API key, access token, cookie, Authorization header.
- Password, OTP, private key.
- Full payment card/bank data.
- PII không cần thiết.
- Raw document bí mật khi chỉ cần metadata/hash.

Ví dụ mask trước khi trace:

```ts
function sanitize(value: unknown): unknown {
  const text = JSON.stringify(value);

  return JSON.parse(
    text
      .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "Bearer [REDACTED]")
      .replace(/sk-[A-Za-z0-9_-]+/g, "[REDACTED_SECRET]")
      .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]"),
  );
}
```

Trong production nên dùng mask hook của Langfuse/OpenTelemetry thay vì chỉ dựa vào regex đơn giản.

---

# 12. Thuật toán instrumentation cho agent

```text
KHI BẮT ĐẦU REQUEST
1. Tạo root observation agent-request.
2. Gắn sessionId, pseudonymous userId, release, environment và tags.
3. Ghi input đã sanitize.

MỖI BƯỚC AGENT
4. Planner -> span.
5. Retrieval -> retriever observation.
6. Tool call -> span tên tool:<tool-name>.
7. LLM call -> generation observation có model, prompt version, usage và cost.
8. Validation -> span.

KHI THÀNH CÔNG
9. Ghi output đã sanitize.
10. Ghi score deterministic nếu có rubric.
11. End observations.

KHI LỖI
12. Gắn level=ERROR và statusMessage.
13. Không nuốt lỗi nghiệp vụ.
14. End observations trong finally.

KHI PROCESS SẮP KẾT THÚC
15. Flush/shutdown telemetry.
```

---

# 13. Lưu ý eventual consistency

Dữ liệu mới ingest thường không xuất hiện ngay lập tức khi query. Thiết kế pipeline đọc sau ghi với delay/retry; tài liệu Langfuse nêu dữ liệu thường khả dụng để query sau khoảng 15–30 giây, nhưng có thể dao động.

Không viết test integration giả định trace vừa gửi sẽ query thấy tức thì.

---

# 14. Error handling

## Auth/config

- `401`: kiểm tra Basic Auth, key pair và base URL region.
- `403`: key sai scope/project hoặc endpoint/feature không cho phép.
- `404`: sai base URL, endpoint, prompt name hoặc resource ID.

## Rate/server

- `429`: dùng backoff và `Retry-After` nếu có.
- `5xx`: retry giới hạn.

## Telemetry

- Nếu Langfuse tạm unavailable, ứng dụng chính vẫn phải hoạt động.
- Buffer phải có giới hạn để tránh memory leak.
- Log lỗi export nội bộ nhưng không log payload nhạy cảm.

## Query

- Luôn bound time range.
- Pagination đến khi `meta.cursor` null/missing.
- `inputPrice`, `outputPrice`, `totalPrice` có thể là string để giữ precision; parse decimal cẩn thận.

---

# 15. MCP cho AI assistant

Langfuse có MCP server theo project. Đây là lựa chọn phù hợp khi coding agent cần đọc prompt/trace trực tiếp mà không cần tự viết REST wrapper.

Endpoint ví dụ EU:

```text
https://cloud.langfuse.com/api/public/mcp
```

Auth:

```text
Authorization: Basic base64(public-key:secret-key)
```

Nếu chỉ cần đọc, cấu hình allowlist read-only; không cấp write tool mặc định cho agent không tin cậy.

MCP là lựa chọn tích hợp, nhưng tracing runtime vẫn nên triển khai bằng SDK/OpenTelemetry.

---

# 16. Checklist production

- [ ] Tracing khởi tạo trước agent/model imports.
- [ ] Có shutdown/flush cho process ngắn.
- [ ] Secret nằm trong secret manager.
- [ ] Base URL đúng region/self-hosted instance.
- [ ] Input/output/tool arguments đã mask.
- [ ] Có userId pseudonymized và sessionId hợp lý.
- [ ] Có release/environment/tags.
- [ ] LLM call được ghi dưới type `generation`.
- [ ] Tool call và retrieval được trace riêng.
- [ ] Prompt production dùng version/label ổn định.
- [ ] Query API v2 có time range và cursor pagination.
- [ ] Mặc định không lấy field group `io`.
- [ ] Telemetry failure không làm hỏng request chính.
- [ ] Score có rubric rõ ràng.
- [ ] Có retention và access-control policy cho trace data.

---

# 17. Tài liệu chính thức

- https://langfuse.com/docs/observability/get-started
- https://langfuse.com/docs/observability/sdk/overview
- https://langfuse.com/docs/observability/sdk/instrumentation
- https://langfuse.com/docs/api-and-data-platform/features/public-api
- https://langfuse.com/docs/api-and-data-platform/features/observations-api
- https://langfuse.com/docs/api-and-data-platform/features/query-via-sdk
- https://langfuse.com/docs/prompt-management/get-started
- https://langfuse.com/docs/prompt-management/features/prompt-version-control
- https://langfuse.com/docs/api-and-data-platform/features/mcp-server
- https://api.reference.langfuse.com/

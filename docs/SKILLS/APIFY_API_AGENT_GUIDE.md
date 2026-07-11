---
name: apify-api-agent-guide
description: Playbook để AI agent tìm Actor, chạy Actor/Task, theo dõi run, lấy Dataset và kiểm soát chi phí qua Apify API.
last_verified: 2026-07-11
language: vi
---

# Apify API — hướng dẫn cho AI Agent

## 1. Mô hình tư duy

Luồng Apify phổ biến:

```text
Actor hoặc Task
    -> Run
        -> defaultDatasetId
            -> Dataset items
```

- **Actor**: chương trình scraping/automation có input schema riêng.
- **Task**: cấu hình Actor đã được lưu sẵn, có thể override một phần input.
- **Run**: một lần thực thi Actor/Task.
- **Dataset**: nơi Actor thường lưu các record đầu ra.
- **Key-value store**: thường chứa file, JSON `OUTPUT`, ảnh, HTML hoặc artifact khác.

Agent không được giả định mọi Actor có cùng input/output. Trước khi gọi Actor lạ, phải đọc API page, README hoặc input schema của Actor đó.

## 2. Xác thực

Biến môi trường:

```bash
APIFY_TOKEN=your_apify_token
```

Header REST được khuyến nghị:

```http
Authorization: Bearer <APIFY_TOKEN>
```

Không đặt token trong URL vì URL có thể bị lưu vào history, access log và analytics.

Dùng scoped token có quyền tối thiểu cần thiết khi chạy trong production.

## 3. Cài SDK TypeScript

```bash
npm install apify-client
```

```ts
import { ApifyClient } from "apify-client";

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});
```

SDK chính thức có parsing response, TypeScript types và retry/backoff cho request API.

---

# 4. Tool contract đề xuất

## 4.1 `apify_run_actor`

```json
{
  "name": "apify_run_actor",
  "description": "Chạy một Apify Actor với input đã validate, chờ kết quả hoặc trả về run ID để theo dõi.",
  "parameters": {
    "type": "object",
    "properties": {
      "actor_id": {
        "type": "string",
        "description": "SDK: owner/actor-name. REST: owner~actor-name hoặc Actor ID."
      },
      "input": { "type": "object" },
      "mode": { "type": "string", "enum": ["sync", "async"] },
      "max_items": { "type": "integer", "minimum": 1 },
      "timeout_seconds": { "type": "integer", "minimum": 1 },
      "memory_mb": { "type": "integer", "minimum": 128 }
    },
    "required": ["actor_id", "input"]
  }
}
```

Mặc định:

- Dùng `sync` khi run dự kiến ngắn và agent cần dữ liệu ngay.
- Dùng `async` khi scraping lớn, chạy theo queue hoặc có thể vượt giới hạn kết nối HTTP.
- Luôn đặt giới hạn record/cost nếu Actor hỗ trợ.

## 4.2 `apify_get_run`

```json
{
  "name": "apify_get_run",
  "description": "Lấy trạng thái và metadata của một Actor run.",
  "parameters": {
    "type": "object",
    "properties": {
      "run_id": { "type": "string" },
      "wait_for_finish_seconds": { "type": "integer", "minimum": 0, "maximum": 60 }
    },
    "required": ["run_id"]
  }
}
```

## 4.3 `apify_get_dataset_items`

```json
{
  "name": "apify_get_dataset_items",
  "description": "Lấy record từ dataset của một Actor run với pagination và field projection.",
  "parameters": {
    "type": "object",
    "properties": {
      "dataset_id": { "type": "string" },
      "offset": { "type": "integer", "minimum": 0 },
      "limit": { "type": "integer", "minimum": 1, "maximum": 1000 },
      "clean": { "type": "boolean" },
      "fields": { "type": "array", "items": { "type": "string" } },
      "format": {
        "type": "string",
        "enum": ["json", "jsonl", "csv", "html", "xlsx", "xml", "rss"]
      }
    },
    "required": ["dataset_id"]
  }
}
```

---

# 5. Chọn Actor đúng cách

Trước khi chạy Actor từ Store, agent phải xác nhận:

1. Actor giải quyết đúng website/use case.
2. Actor đang được duy trì và không có dấu hiệu deprecated.
3. Input schema và field bắt buộc.
4. Output nằm ở Dataset hay Key-value store.
5. Pricing model và giới hạn charge.
6. Actor có cần proxy, cookie hoặc credential không.
7. Điều khoản website cho phép automation theo mục đích của người dùng.

Không tự tạo input field chỉ dựa vào tên gọi. Input schema khác nhau giữa các Actor.

---

# 6. Chạy Actor bằng SDK

## 6.1 Sync: chạy và chờ hoàn tất

```ts
import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

const run = await client.actor("apify/web-scraper").call({
  startUrls: [{ url: "https://example.com" }],
  maxCrawlPages: 10,
});

if (run.status !== "SUCCEEDED") {
  throw new Error(`Actor ended with status ${run.status}: ${run.statusMessage ?? ""}`);
}

const { items } = await client.dataset(run.defaultDatasetId).listItems({
  clean: true,
  limit: 100,
});

console.log(items);
```

`call()` chờ bằng smart polling. Tuy vậy, code vẫn phải kiểm tra `run.status`; terminal state không đồng nghĩa với success.

## 6.2 Async: start, chờ và lấy dataset

```ts
import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

const startedRun = await client.actor("apify/web-scraper").start({
  startUrls: [{ url: "https://example.com" }],
  maxCrawlPages: 100,
});

console.log("Run ID:", startedRun.id);

const finishedRun = await client.run(startedRun.id).waitForFinish({
  waitSecs: 900,
});

if (finishedRun.status !== "SUCCEEDED") {
  throw new Error(
    `Actor failed: ${finishedRun.status} - ${finishedRun.statusMessage ?? "No status message"}`,
  );
}

const { items } = await client
  .dataset(finishedRun.defaultDatasetId)
  .listItems({ clean: true, limit: 1000 });

console.log(items);
```

`waitForFinish()` có thể resolve với `FAILED`, `ABORTED` hoặc `TIMED-OUT`; nó không tự throw chỉ vì run không thành công.

## 6.3 Chạy Task

Task phù hợp khi input/proxy/memory đã được cấu hình sẵn trong Apify Console.

```ts
const run = await client.task("TASK_ID_OR_NAME").call({
  maxItems: 20, // override một phần input nếu Task/Actor hỗ trợ field này
});
```

Không nhầm `maxItems` trong Actor input với query parameter `maxItems` dùng làm charge guardrail cho pay-per-result Actor. Tên giống nhau nhưng ngữ nghĩa có thể khác.

---

# 7. REST API

Base URL:

```text
https://api.apify.com/v2
```

Dùng canonical prefix `/v2/actors/`. Prefix cũ `/v2/acts/` vẫn có thể hoạt động nhưng đã deprecated.

## 7.1 Sync và trả thẳng Dataset items

```bash
curl -X POST \
  "https://api.apify.com/v2/actors/apify~web-scraper/run-sync-get-dataset-items?clean=true&limit=100" \
  -H "Authorization: Bearer $APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startUrls": [{"url": "https://example.com"}],
    "maxCrawlPages": 10
  }'
```

Endpoint:

```text
POST /v2/actors/:actorId/run-sync-get-dataset-items
```

Đặc điểm:

- Response là dataset items, không phải envelope `{ data: ... }` thông thường.
- Kết nối có giới hạn tối đa khoảng 300 giây.
- Nếu request timeout, run có thể vẫn tiếp tục trên Apify; không nên tự động start một run mới trước khi kiểm tra.

## 7.2 Start async

```bash
curl -X POST \
  "https://api.apify.com/v2/actors/apify~web-scraper/runs?maxItems=100" \
  -H "Authorization: Bearer $APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startUrls": [{"url": "https://example.com"}],
    "maxCrawlPages": 100
  }'
```

Endpoint:

```text
POST /v2/actors/:actorId/runs
```

Response thường có dạng:

```json
{
  "data": {
    "id": "RUN_ID",
    "status": "READY",
    "defaultDatasetId": "DATASET_ID"
  }
}
```

## 7.3 Poll run

```bash
curl \
  "https://api.apify.com/v2/actor-runs/RUN_ID?waitForFinish=60" \
  -H "Authorization: Bearer $APIFY_TOKEN"
```

Endpoint:

```text
GET /v2/actor-runs/:runId
```

`waitForFinish` của REST tối đa 60 giây mỗi request. Nếu vẫn `READY` hoặc `RUNNING`, tiếp tục poll với backoff.

## 7.4 Lấy dataset

```bash
curl \
  "https://api.apify.com/v2/datasets/DATASET_ID/items?clean=true&offset=0&limit=100" \
  -H "Authorization: Bearer $APIFY_TOKEN"
```

Có thể chọn field:

```text
?fields=title,url,price&clean=true
```

Hoặc format:

```text
?format=csv
?format=jsonl
?format=xlsx
```

---

# 8. Run statuses

| Status | Loại | Ý nghĩa |
|---|---|---|
| `READY` | Initial | Đã tạo nhưng chưa được worker nhận |
| `RUNNING` | Transitional | Đang chạy |
| `TIMING-OUT` | Transitional | Đang chuyển sang timeout |
| `ABORTING` | Transitional | Đang abort |
| `SUCCEEDED` | Terminal | Thành công |
| `FAILED` | Terminal | Thất bại |
| `TIMED-OUT` | Terminal | Hết thời gian |
| `ABORTED` | Terminal | Bị huỷ |

Agent chỉ được lấy kết quả cuối cùng như thành công khi `status === "SUCCEEDED"`.

Nếu run thất bại, ưu tiên đọc:

- `statusMessage`
- run log
- Actor output/error record
- resource usage/cost metadata

---

# 9. Pagination Dataset

Không tải dataset lớn trong một request rồi đưa toàn bộ vào context LLM.

```ts
async function* iterateDataset(
  client: ApifyClient,
  datasetId: string,
  pageSize = 250,
) {
  let offset = 0;

  while (true) {
    const page = await client.dataset(datasetId).listItems({
      offset,
      limit: pageSize,
      clean: true,
    });

    for (const item of page.items) yield item;

    if (page.items.length < pageSize) break;
    offset += page.items.length;
  }
}
```

Agent nên:

1. Project chỉ field cần thiết.
2. Lưu dữ liệu lớn vào DB/object storage.
3. Chỉ đưa sample hoặc summary vào LLM context.
4. Deduplicate theo URL/ID nếu Actor có thể ghi trùng.

---

# 10. Kiểm soát chi phí

Trước mỗi run, agent phải ước lượng:

```text
số URL × độ sâu crawl × số item tối đa × pricing model
```

Guardrail:

- Dùng query parameter `maxItems` cho pay-per-result Actor khi phù hợp.
- Dùng `maxTotalChargeUsd` nếu Actor/API flow hỗ trợ và hệ thống đã cấu hình ngân sách.
- Đặt timeout và memory có chủ đích.
- Không start lại vô điều kiện sau network timeout; kiểm tra run gần nhất/run ID trước.
- Không chạy song song số lượng lớn nếu chưa có concurrency budget.

Ví dụ REST:

```text
POST /v2/actors/:actorId/runs?maxItems=100&timeout=600&memory=1024
```

## Chính sách đề xuất

```text
Nếu estimated cost vượt ngân sách tự động -> yêu cầu người dùng xác nhận.
Nếu Actor pricing không rõ -> không chạy production scale.
Nếu task có thể tạo vô hạn URL -> bắt buộc có max depth/max pages/max items.
```

---

# 11. Thuật toán tự gọi Apify

```text
INPUT: mục tiêu scraping/automation

1. Tìm hoặc nhận actor_id/task_id.
2. Đọc Actor API page/input schema.
3. Chuẩn hoá actor_id:
   - SDK: owner/actor-name
   - REST path: owner~actor-name
4. Validate input theo schema của Actor.
5. Xác định output storage: Dataset hay Key-value store.
6. Tính giới hạn: max items, timeout, memory, concurrency, budget.
7. Chọn sync hoặc async.
8. Start run và lưu run_id ngay.
9. Theo dõi đến terminal state.
10. Nếu SUCCEEDED:
    - lấy defaultDatasetId hoặc defaultKeyValueStoreId;
    - paginate;
    - validate output;
    - loại record lỗi/trống/trùng.
11. Nếu FAILED/TIMED-OUT/ABORTED:
    - đọc statusMessage và log;
    - chỉ retry khi lỗi tạm thời;
    - không retry lỗi input/auth/cost y nguyên.
12. Trả kết quả kèm actor_id, run_id, dataset_id và số record.
```

---

# 12. Retry và idempotency

Scraping run thường không idempotent về chi phí: gọi lại có thể tạo thêm run và bị charge lần nữa.

Trước retry start request, agent phải biết request đầu tiên có tạo run hay chưa.

Nên gắn correlation ID của ứng dụng vào input/metadata nếu Actor hỗ trợ và lưu mapping:

```text
application_job_id -> apify_run_id
```

Retry được:

- 429
- 5xx
- network lỗi trước khi xác nhận run đã được tạo
- run failure do hạ tầng tạm thời sau khi đọc log

Không retry y nguyên:

- 400 input schema sai
- 401/403 token hoặc permission
- Actor deprecated/không tồn tại
- run vượt budget
- website từ chối truy cập do quyền/điều khoản

---

# 13. Bảo mật

Agent không được:

- Expose `APIFY_TOKEN` trong URL, prompt hoặc log.
- Dùng Actor để truy cập tài khoản/dữ liệu không được phép.
- Gửi credential trực tiếp vào Actor không đáng tin cậy.
- Tự động mua Actor/service hoặc tăng ngân sách.
- Bỏ qua robots/terms/quy định pháp lý áp dụng.

Nên:

- Dùng scoped token.
- Chỉ cho token quyền Run/Read Storage cần thiết.
- Review Actor bên thứ ba trước khi truyền cookie/credential.
- Mask PII trong dataset trước khi đưa cho LLM.

---

# 14. Checklist production

- [ ] Actor không deprecated và đúng use case.
- [ ] Input đã validate theo Actor schema.
- [ ] Token dùng Authorization Bearer và có quyền tối thiểu.
- [ ] Có `maxItems`/max pages/timeout/budget.
- [ ] Lưu `run_id` ngay sau start.
- [ ] Chỉ coi `SUCCEEDED` là thành công.
- [ ] Có pagination Dataset.
- [ ] Không nạp dataset lớn trực tiếp vào context.
- [ ] Có retry policy tránh tạo run trùng.
- [ ] Có audit log actor/run/dataset nhưng không log secret.
- [ ] Có human approval nếu automation gây thay đổi trạng thái bên ngoài.

---

# 15. Tài liệu chính thức

- https://docs.apify.com/api/v2
- https://docs.apify.com/api/client/js/docs
- https://docs.apify.com/api/client/js/docs/introduction/quick-start
- https://docs.apify.com/api/client/js/reference/class/RunClient
- https://docs.apify.com/academy/api/run-actor-and-retrieve-data-via-api
- https://docs.apify.com/api/v2/act-runs-post
- https://docs.apify.com/api/v2/act-run-sync-get-dataset-items-post
- https://docs.apify.com/api/v2/actor-run-get
- https://docs.apify.com/platform/actors/development/programming-interface/status-messages

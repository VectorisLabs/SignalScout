# CorpWatch Strategic Change Radar

CorpWatch là OpenAI chat agent điều tra bằng chứng thay đổi doanh nghiệp, kết hợp replay có citation, metric coverage, readiness gate và ba tư thế quyết định: `MAINTAIN`, `ADAPT`, `ACCELERATE`.

Chat flow dùng OpenAI Responses API với một function tool trung lập. Application-side router chọn TinyFish hoặc Apify theo policy; Evidence Gate quyết định candidate có đủ điều kiện hay không; Langfuse ghi trace và evaluation scores. Frozen dashboard vẫn chạy offline khi không có provider key.

## Cấu trúc dự án

```text
backend/
├── src/contracts/       Canonical CasePackage và Zod schemas
├── src/agent/           OpenAI loop, Collector Router, Evidence Gate, audit metrics
├── src/metrics/         Deterministic metric extraction
├── src/report/          Metric coverage và readiness gates
├── src/partners/        URL, SSRF, cost và payload safety contracts
├── src/server.ts        Chat, metrics và health HTTP API
├── scripts/             Case builder, bundle validator, partner preflight
└── tests/               Backend unit và adversarial tests

frontend/
├── src/app/             Chatbox, Agent Operations và Executive Dashboard
├── public/demo/         Frozen validated CasePackage
└── src/app/App.test.tsx Frontend journey và temporal tests
```

Các lệnh trong README được chạy từ thư mục root của repository.

## Yêu cầu

- Node.js 22 hoặc mới hơn.
- npm 10 hoặc mới hơn.

Kiểm tra môi trường:

```bash
node --version
npm --version
```

## Cài đặt

```bash
npm install
```

Repository dùng npm workspaces. Lệnh trên cài dependency cho cả `backend` và `frontend`.

## Test flow nhanh

Chạy toàn bộ automated gate:

```bash
npm test
npm run typecheck
npm run build
npm run validate:public-bundle
```

Kết quả mong đợi:

- Backend: 33 tests pass.
- Frontend: 5 tests pass.
- TypeScript typecheck của hai workspace pass.
- Case bundle được sinh tại `frontend/public/demo/case-package.json`.
- Validator in JSON có `"status":"VALID"`.
- Vite production build hoàn thành trong `frontend/dist/`.

## Flow kiểm thử chi tiết

### 1. Backend unit tests

```bash
npm --workspace @corpwatch/backend test
```

Test backend bao phủ:

- Extract đủ metric dictionary và giữ `sourceId`/`evidenceId`.
- Chuẩn hóa `$7.1 billion` thành `7100 USD_MILLIONS`.
- Không suy diễn giá trị tài chính thiếu currency hoặc scale.
- Employee count là optional.
- Hai lần build cùng input tạo output giống nhau.
- Replay không chứa evidence ở tương lai.
- Validator từ chối secret, dangling reference, false readiness và unsafe URL.
- Partner safety từ chối private IP, metadata endpoint, IPv6 loopback và payload vượt giới hạn.
- Collector Router chọn official API, TinyFish Search/Fetch hoặc Apify theo policy.
- Evidence Gate giữ candidate ở trạng thái pending cho đến khi curator approve.

Chạy một suite riêng:

```bash
npm --workspace @corpwatch/backend exec vitest run tests/metrics/extract-metric-observations.test.ts
npm --workspace @corpwatch/backend exec vitest run tests/scripts/validate-public-bundle.test.ts
```

### 2. Frontend journey tests

```bash
npm --workspace @corpwatch/frontend test
```

Test frontend xác nhận:

- Dashboard load frozen bundle thành công.
- Các section replay, radar, metric lens, scenarios và executive agenda xuất hiện.
- Outcome tương lai không bị lộ khi chọn replay frame cũ.
- Decision sections bị block khi thiếu required metrics.
- Bundle load failure hiển thị hướng dẫn xử lý.
- Chatbox và Agent Operations metrics/charts render đúng.

### 3. OpenAI chat và collector test flow

Copy `.env.example` thành `.env` rồi điền các biến cần thiết:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=
COLLECTOR_EXECUTION_MODE=validate
TINYFISH_API_KEY=
APIFY_TOKEN=
APIFY_ACTOR_ID=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

`COLLECTOR_EXECUTION_MODE=validate` là mode mặc định an toàn: OpenAI có thể request tool, router vẫn chọn route và ghi audit log nhưng không gọi paid collector.

Chạy cả backend và frontend:

```bash
npm run dev
```

Endpoints:

```text
Frontend:       http://127.0.0.1:5173/
Backend health: http://127.0.0.1:8787/api/health
Agent metrics:  http://127.0.0.1:8787/api/metrics
Chat API:       POST http://127.0.0.1:8787/api/chat
```

Chat request mẫu:

```json
{
  "sessionId": "demo-session-001",
  "message": "Find public restructuring evidence for Example Retail between January and July 2026"
}
```

Kiểm tra UI:

1. Gửi prompt không cần web và xác nhận assistant trả lời mà không tạo collector route.
2. Gửi discovery prompt và xem Tool execution log.
3. Xác nhận model chỉ gọi `collect_public_evidence`; provider được chọn trong backend.
4. Với URL đã biết, route phải là `TINYFISH_FETCH`.
5. Với batch/recurring hoặc hơn 10 URL, route phải là `APIFY_ASYNC`.
6. Candidate chưa có curator approval không được hiển thị như approved citation.

Focused routing/gate tests:

```bash
npm --workspace @corpwatch/backend exec vitest run tests/agent/router.test.ts
npm --workspace @corpwatch/backend exec vitest run tests/agent/evidence-gate.test.ts
```

### 4. Langfuse validation observability

Evidence Gate chạy đồng bộ trong application và fail-closed. Langfuse không thay thế validator; Langfuse nhận:

- trace `corpwatch-chat-turn`;
- OpenAI generation;
- collector route/tool execution;
- boolean scores cho schema, public URL, replay time, content, rights và overall gate;
- token, model và latency metadata khi provider trả về.

Khi Langfuse chưa được cấu hình, chat và Evidence Gate vẫn hoạt động. Khi đã cấu hình, kiểm tra Langfuse project:

1. Có trace cho mỗi chat turn.
2. OpenAI call nằm trong trace/session tương ứng.
3. Evidence Gate scores được gắn vào trace.
4. Không có API key, Authorization header hoặc full raw page trong trace.
5. Dashboard local hiển thị run logs, route distribution, validation rate, latency và token totals.

Core AI also reads the text prompt `corpwatch/chat-agent` with label `production`. Prompt retrieval uses a short timeout, 60-second cache and the reviewed local developer prompt as fallback. The Operations run log shows `promptSource`, `promptVersion` and a Langfuse trace link so a prompt rollout can be audited without making Langfuse a runtime dependency.

Recommended prompt release workflow:

1. Create a new `corpwatch/chat-agent` version in Langfuse without the `production` label.
2. Run the routing/Evidence Gate dataset and compare scores against the current version.
3. Have a human review tool behavior, citation boundaries and replay integrity.
4. Move the `production` label only after the eval gate passes.
5. Roll back by moving the label to the previous version; no code deployment is required.

### 5. Typecheck

```bash
npm run typecheck
```

Lệnh này typecheck lần lượt backend và frontend, bao gồm contract import từ `@corpwatch/backend/contracts`.

### 6. Generate frozen case

```bash
npm run build:case
```

Output:

```text
frontend/public/demo/case-package.json
```

Không sửa file JSON này bằng tay. Hãy sửa fixture hoặc builder trong backend rồi generate lại.

Kiểm tra tính deterministic bằng PowerShell:

```powershell
npm run build:case
$first = (Get-FileHash frontend\public\demo\case-package.json -Algorithm SHA256).Hash
npm run build:case
$second = (Get-FileHash frontend\public\demo\case-package.json -Algorithm SHA256).Hash
$first -eq $second
```

Kết quả phải là `True`.

### 7. Validate public bundle

```bash
npm run validate:public-bundle
```

Success output có dạng:

```json
{"status":"VALID","caseId":"bbb-retrospective-v1","sources":2,"evidence":4}
```

Validator fail-closed với:

- Schema không hợp lệ.
- Evidence/source ID không tồn tại.
- Metric provenance không khớp.
- Future evidence trong replay.
- Claim thiếu approved evidence.
- Section khai báo `READY` khi thiếu required metrics.
- Secret hoặc authorization-like content.
- Private/internal source URL.
- Evidence vi phạm rights policy.
- Raw excerpt vượt public-safe limit.

Để test negative cases tự động:

```bash
npm --workspace @corpwatch/backend exec vitest run tests/scripts/validate-public-bundle.test.ts
```

### 8. Partner validate-only preflight

```powershell
$env:PARTNER_EXECUTION_MODE = "validate"
npm run preflight:partners
```

Expected:

```json
{
  "mode": "validate",
  "networkCalls": 0,
  "status": "LOCAL_CONTRACTS_VALIDATED",
  "partners": ["Apify", "Langfuse", "TinyFish"],
  "liveReceipt": false
}
```

Flow này chỉ validate request bounds và safety contracts. Nó không gọi API, không tốn credit và không chứng minh partner đã được sử dụng live.

## Chạy localhost

Development mode khởi động đồng thời backend và frontend:

```bash
npm run dev
```

Mở:

```text
http://127.0.0.1:5173/
```

Production preview:

```bash
npm run build
npm run preview
```

## Manual dashboard test flow

### Replay và temporal integrity

1. Mở dashboard và xác nhận label `Offline replay`.
2. Chọn frame ngày `Apr 21, 2021`.
3. Xác nhận outcome năm 2023 không xuất hiện trong timeline hoặc pattern radar.
4. Chọn frame `Apr 24, 2023`.
5. Xác nhận evidence outcome lúc này mới xuất hiện.
6. Mở một approved source link và kiểm tra source tương ứng với evidence ID.

### Metric lens

1. Tìm metric `Revenue / net sales`.
2. Xác nhận giá trị hiển thị `7,100 USD millions` và period `FY2020`.
3. Xác nhận từng metric có evidence link.
4. Xác nhận status không chỉ được biểu diễn bằng màu.

### Decision journey

1. Kiểm tra đủ ba scenario `MAINTAIN`, `ADAPT`, `ACCELERATE`.
2. Kiểm tra từng scenario có Cost, Benefit, Risk và impact.
3. Xác nhận recommendation là review posture, không phải dự báo chắc chắn.
4. Kiểm tra challenger questions và limitations.
5. Xác nhận Northstar Home Retail luôn được ghi rõ là fictional.

### Responsive và accessibility

Kiểm tra ở các viewport gần đúng:

- Mobile: 360 px.
- Tablet: 768 px.
- Desktop: từ 1280 px.

Ở mỗi viewport:

1. Không có horizontal overflow ngoài metric table container.
2. Evidence title dài wrap bình thường.
3. Điều hướng được bằng `Tab`.
4. Focus indicator nhìn thấy rõ.
5. Select `As-of date`, source link và internal evidence link dùng được bằng bàn phím.

## Full freeze checklist

Trước khi quay video hoặc submit:

```bash
npm test
npm run typecheck
npm run build
npm run validate:public-bundle
```

Sau đó xác nhận thủ công:

- Frozen bundle deterministic.
- Dashboard chạy khi không có provider key.
- Không có `.env`, API key, raw page hoặc receipt trong public assets.
- Mọi factual claim có evidence link.
- Known outcome không leak vào replay frame cũ.
- Missing metric không bị trình bày như `READY`.
- Demo rehearsal hoàn thành dưới ba phút hai lần liên tiếp.

Demo script đầy đủ nằm tại `docs/demo/corpwatch-demo-runbook.md`.

## Troubleshooting

### Dashboard báo không load được bundle

```bash
npm run build:case
npm run validate:public-bundle
npm run dev
```

### Port 5173 đang được sử dụng

```bash
npm --workspace @corpwatch/frontend run dev -- --host 127.0.0.1 --port 5174
```

Sau đó mở `http://127.0.0.1:5174/`.

Nếu port backend `8787` bận, đổi `BACKEND_PORT` trong `.env` và cập nhật proxy target trong `frontend/vite.config.ts`.

### Workspace dependency chưa được link

Chạy lại từ root:

```bash
npm install
npm run typecheck
```

### Không được claim partner live

`preflight:partners` và `COLLECTOR_EXECUTION_MODE=validate` chỉ là local validation. Chỉ dùng trạng thái `LIVE_RECEIPT` khi đã có một invocation thật, sanitized receipt và explicit approval theo hướng dẫn trong `docs/SKILLS/`.

Plan kiến trúc hiện hành nằm tại `docs/corpwatch-openai-chat-implementation-plan.md`. Routing policy nằm tại `docs/RULES/bedrock-collector-routing-rules.md` (giữ filename lịch sử, nội dung đã chuyển sang OpenAI).

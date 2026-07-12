
# MEMORY.md — AI Market Theme Detection Architecture

Tài liệu ghi lại toàn bộ tri thức, quyết định kiến trúc, và lý do đằng sau, tích lũy qua quá trình thiết kế.

## 1. Bối cảnh dự án

- **Ý tưởng số 3**: Phát hiện chủ đề thị trường "Major Corporate Restructuring: Job Cuts, Asset Sales, and Strategic Realignments" (Tái cấu trúc doanh nghiệp lớn: cắt giảm nhân sự, bán tài sản, tái cơ cấu chiến lược).
- **Nguồn gốc**: Từ bảng "Market Themes" trên Advisor Dashboard của một Wealth Management Portal (có sẵn, React frontend).
- **Mục tiêu**: Kiến trúc AWS chuyên nghiệp, đúng chuẩn AWS, full serverless, dùng Amplify, tối ưu chi phí.
- **Dịch vụ ngoài bắt buộc**: TinyFish, Langfuse, Apify.
- **Định dạng bản vẽ**: draw.io (`.drawio`).
- **Ngành**: Wealth management → nhạy cảm, cần compliance/audit, ảnh hưởng quyết định đầu tư.

## 2. Kiến trúc tổng thể (đã chốt)

Mô hình multi-agent **supervisor-worker** trên Bedrock AgentCore Runtime:

- **AgentCore Runtime Management** (supervisor/orchestrator) — điều phối luồng.
- **Crawler Subagent** — gọi TinyFish/Apify thu thập data, sanitize, filter.
- **Analysis Subagent** — phân tích theme + sentiment bằng model reasoning.

### Luồng chính (frontend request)

```
Users → Route53 → Amplify (Gen2 Hosting) → API Gateway → Lambda → AgentCore Runtime Management
```

- Số thứ tự trong diagram: 1 (Cognito auth vào API Gateway), 2 (API GW → Lambda), 3 (Lambda → Management).

### Luồng xử lý (supervisor-worker)

```
Management --InvokeAgentRuntime--> Crawler (invoke)
Crawler --gọi--> TinyFish / Apify --trả JSON--> Crawler (Strands Agent filter/sanitize)
Crawler --A2A response--> Management
Management --InvokeAgentRuntime (kèm data đã lọc)--> Analysis
Analysis --model reasoning (theme + sentiment)--> Management
Management --> ghi kết quả (S3 + DynamoDB)
```

### Luồng đọc/ghi data

```
Ghi:  Lambda Webhook-Handler → S3 (PutObject) → DynamoDB (UpdateItem)
Đọc:  Amplify → AppSync → Lambda resolver → DynamoDB → S3 (presigned URL) → browser tải trực tiếp
```

## 3. Các dịch vụ AWS trong kiến trúc

| Service                                         | Vai trò                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| Route53                                         | DNS                                                                                  |
| Amplify Gen2 Hosting                            | CI/CD từ Git + CDN + host React dashboard                                           |
| Cognito                                         | Amplify Auth (user pool + identity pool)                                             |
| WAF                                             | Bảo vệ tầng frontend/API                                                          |
| API Gateway                                     | HTTP API (rẻ hơn REST ~70%); endpoint riêng cho webhook                           |
| Lambda                                          | Trigger AgentCore (InvokeAgentRuntime); resolver cho AppSync; webhook handler        |
| AppSync                                         | Amplify Data — GraphQL API (getMarketThemes)                                        |
| AgentCore Runtime (Management/Crawler/Analysis) | Host Strands Agents                                                                  |
| AgentCore Memory                                | Short-term memory / session context (đọc/ghi bởi Management, KHÔNG phải Lambda) |
| Bedrock (model) + Guardrails                    | Model reasoning + safety filter                                                      |
| DynamoDB                                        | Metadata + retry_count (On-Demand)                                                   |
| S3 (Intelligent-Tiering)                        | Lưu raw data + kết quả, đa-attempt                                               |
| Secrets Manager                                 | API key TinyFish/Apify/Langfuse; webhook signing secret                              |
| CloudWatch                                      | App logs, metrics, alarms                                                            |
| CloudTrail                                      | Audit API calls (compliance)                                                         |
| IAM                                             | Least-privilege execution roles (không vẽ như node network)                       |

### Dịch vụ ngoài (SaaS)

- **TinyFish**: AI web agent (đọc IR page, press release).
- **Apify**: web scraping actors (news sites, SEC filings).
- **Langfuse**: LLM observability, tracing, scoring, prompt management.

## 4. Quyết định kiến trúc quan trọng & lý do

### 4.1. Tránh Lambda chaining / Runtime-gọi-thẳng-Runtime

- **Không** để Lambda gọi trực tiếp Lambda, hoặc worker gọi thẳng worker.
- Dùng decouple: S3 event, hoặc supervisor điều phối tập trung.
- Lý do: tránh tính phí thời gian chờ gấp đôi, coupling chặt, khó retry/scale độc lập, tránh vòng lặp vô hạn.

### 4.2. Supervisor điều phối, KHÔNG để A gọi thẳng B

- Management gọi A rồi gọi B (mô hình sao), A và B KHÔNG nối trực tiếp.
- Lý do (AWS Well-Architected Agentic AI Lens, AGENTPERF05-BP02): supervisor-worker khi cần centralized quality control; dễ kiểm soát lỗi, dễ trace handoff, tái sử dụng worker.

### 4.3. AgentCore Runtime gọi API ngoài KHÔNG cần Lambda trung gian

- Code trong AgentCore Runtime tự gọi HTTPS ra TinyFish/Apify trực tiếp.
- Lý do (AWS networking blog): AgentCore Runtime có network riêng, truy cập được cả public và private resource.
- AgentCore Gateway CHỈ cần khi: nhiều agent dùng chung tool, cần audit/rate-limit tập trung, expose MCP tool. → Với 1 agent/1 tool = over-engineering, KHÔNG dùng.

### 4.4. TinyFish/Apify là tool được model gọi (tool_use)

- TinyFish/Apify chạy khi model reasoning quyết định gọi tool (function calling trong Strands Agent).
- Endpoint sync: `POST https://agent.tinyfish.ai/v1/automation/run` — block chờ, trả kết quả trong cùng HTTP response.
- Apify sync: `Run Actor synchronously and get dataset items` — chỉ dùng khi Actor chạy < 5 phút.
- Response quay về ĐÚNG nơi gọi (Step gọi), không đi đường khác. Request + response cùng 1 kết nối HTTP.
- TinyFish sync KHÔNG hỗ trợ cancel → set `max_duration_seconds` để giới hạn.

### 4.5. Filter data bằng code thường (không tốn token)

- Sau khi nhận JSON thô từ TinyFish/Apify, filter bằng code Python thuần TRƯỚC khi đưa vào model.
- Lý do: AgentCore đọc JSON không tốn cost đáng kể (compute rẻ), NHƯNG đưa JSON thô vào model tốn token Bedrock rất nhiều (response bloat) + giảm độ chính xác.
- Kỹ thuật: dict key filtering, strip HTML (trafilatura), truncation (~3000 chars), dedup/validate.
- Đặt filter trong code AgentCore Runtime (KHÔNG tách Lambda riêng — tránh network hop thừa).

### 4.6. Rule-based tool selection

- Bedrock chọn gọi TinyFish hoặc Apify dựa trên rule → vẽ hình thoi (decision/diamond) tại Step gọi tool.
- Nếu rule là code cứng (if/else) → hình thoi ngoài lề, trước bước gọi model.
- Nếu rule trong system prompt (model tự chọn) → hình thoi trong bước reasoning.

### 4.7. S3 storage — dùng hay không

- KHÔNG bắt buộc lưu raw data để pipeline chạy (data đi thẳng qua payload InvokeAgentRuntime được).
- NÊN lưu nếu: cần replay khi retry (khỏi gọi lại TinyFish/Apify tốn phí), compliance/audit, debug.
- Nếu data nhỏ (< vài trăm KB) → dùng DynamoDB (giới hạn item 400KB). Nếu lớn → S3.

### 4.8. S3 Storage Class = Intelligent-Tiering

- Lý do: access pattern không đoán được (chỉ đọc lại khi retry/audit, không theo lịch).
- Tự chuyển tier (Frequent → IA sau 30 ngày → Archive Instant Access sau 90 ngày), không phí retrieval, đọc lại tức thì.
- Ưu việt hơn Glacier cứng + lifecycle thủ công (đã bỏ đề xuất Glacier Instant Retrieval trước đó).

### 4.9. Retry / Self-correction loop (Reflexion pattern)

- Analysis xong → export trace + score (LLM-as-Judge) sang Langfuse.
- **Nhánh score cao**: Webhook score.high → Lambda → ghi kết quả (S3 + DynamoDB) hiển thị lên Amplify.
- **Nhánh score thấp**: Langfuse Monitor vượt Alert threshold → Webhook → API Gateway (endpoint riêng) → Lambda Webhook-Handler:
  - Đọc retry_count (DynamoDB, atomic counter).
  - Nếu retry_count < MAX (đề xuất 2): InvokeAgentRuntime gọi lại Management (kèm critique, dùng lại session cũ).
  - Nếu retry_count >= MAX: flag "needs_human_review".
- Payload retry PHẢI kèm `critique` (verbal feedback), không chỉ data gốc — nếu không agent lặp lại lỗi cũ.
- Chọn hướng: **Option B — trigger lại InvokeAgentRuntime** (đã chốt).
- BẮT BUỘC giới hạn retry để tránh vòng lặp vô hạn.

### 4.10. DynamoDB atomic counter cho retry_count

- Dùng `UpdateExpression: 'ADD retry_count :increment'` — atomic, tránh race condition.
- KHÔNG dùng đọc-rồi-ghi thủ công (mất update khi concurrent).

### 4.11. Tách 2 bảng DynamoDB

- `MarketThemes` (display) — expose qua AppSync cho Amplify đọc.
- `PipelineState` (operational) — retry_count, session_id, critique, status — KHÔNG expose qua AppSync.
- Lý do: bảo mật (không lộ internal data), access pattern khác nhau.

### 4.12. S3 lưu đa-attempt, KHÔNG ghi đè

- Key: `raw-market-news/{run_id}/attempt-{n}.json`.
- Lý do: giữ lịch sử để debug, xây eval dataset, compliance.
- DynamoDB metadata: `final_s3_key` (lần thành công) + `retry_history` (metadata ngắn các lần).
- Intelligent-Tiering tự hạ tier attempt cũ → không tăng cost đáng kể.

### 4.13. Amplify hiển thị data từ S3 qua presigned URL

- KHÔNG để browser đọc S3 trực tiếp (S3 private; mở public = lỗ hổng bảo mật).
- Lambda resolver tạo presigned URL (get_object, expires ~1h) → trả cho Amplify.
- Browser tải file trực tiếp từ S3 qua presigned URL (không proxy qua Lambda/AppSync lần 2).
- Chỉ tạo URL cho `final_s3_key`, không cho attempt bị chấm thấp.

### 4.14. Thứ tự ghi vs đọc (2 Lambda khác nhau)

- **Ghi** (Webhook-Handler): S3 trước → DynamoDB sau. Lý do: tránh DynamoDB trỏ tới file chưa tồn tại.
- **Đọc** (Resolver): DynamoDB trước → S3 sau. Lý do: cần biết s3_key trước khi tạo presigned URL.
- Là 2 vòng đời riêng (lúc pipeline xong vs lúc user mở dashboard), KHÔNG nối thành 1 chuỗi.

## 5. Langfuse — chi tiết

### Cơ chế "nhả" dữ liệu ngược (Langfuse không chỉ nhận trace)

1. **Prompt Management**: app fetch prompt từ Langfuse tại runtime (versioned, SDK-level caching). → Langfuse thành config source.
2. **Webhooks**: Langfuse chủ động POST notification khi prompt/score thay đổi → trigger CI/CD, sync.
3. **Scores/Feedback API**: ingest đánh giá ngược vào Langfuse (Numeric/Categorical/Boolean/Text).

### Webhook (đã chọn dùng)

- Cần: API Gateway endpoint riêng (`POST /webhooks/langfuse`), Lambda Webhook-Handler, signing secret (Secrets Manager), DynamoDB.
- BẮT BUỘC verify HMAC signature (chống giả mạo) + check timestamp (chống replay, ~5 phút).
- Endpoint public KHÔNG dùng Cognito (Langfuse không hỗ trợ JWT) → verify signature là bắt buộc.
- KHÔNG dùng chung API Gateway của user-facing (Cognito authorizer).

### Đánh giá đúng/sai

- LLM-as-a-Judge tự chấm điểm output; hoặc human annotation queue.
- Monitors and Alerts: Alert threshold / Warning threshold theo score.
- Wealth management → khuyến nghị flag human review, nhưng user đã chọn Option B (auto retry).

## 6. Guardrails, Strands Agent, AgentCore Runtime — quan hệ (theo doc)

### Bedrock Guardrails = thuộc tính của model, KHÔNG phải service riêng có luồng network

```python
from strands.models import BedrockModel
bedrock_model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-6",
    guardrail_id="your-guardrail-id",
    guardrail_version="DRAFT",
    guardrail_redact_input=True,
)
guardrail_agent = Agent(model=bedrock_model)
```

- Guardrail gắn thẳng vào BedrockModel mà Strands Agent dùng → tự động áp dụng khi agent gọi model.
- **Cách vẽ**: lồng icon Guardrails BÊN TRONG/sát Strands Agent, KHÔNG vẽ mũi tên 2 chiều (trừ khi dùng ApplyGuardrail API độc lập).

### Vị trí Guardrails

| Runtime            | Cần Guardrails?                                                                                           | Lý do                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Management         | Tùy — CÓ nếu supervisor dùng model đọc/tổng hợp nội dung untrusted; BỎ nếu chỉ route metadata |                                                                                  |
| Crawler            | Thường không (chỉ gọi tool thuần, đã có server-side sanitize)                                     |                                                                                  |
| **Analysis** | **BẮT BUỘC**                                                                                       | Nơi nội dung web untrusted vào model reasoning — rủi ro injection cao nhất |

**Điểm chưa chốt**: cần xác nhận Management có dùng model reasoning để route hay chỉ if/else → quyết định giữ/bỏ Guardrails ở Management.

### Server-side validation/sanitization = code, KHÔNG phải icon service

- Vẽ ô rectangle (không icon AWS) trong Crawler, ngay sau khi nhận data từ TinyFish/Apify.
- Strip HTML/script, detect injection patterns, validate schema.
- Lý do: data web là untrusted, có thể chứa prompt injection ẩn.

## 7. AgentCore Runtime — kiến thức nền

- Định nghĩa: môi trường host serverless, bảo mật, chuyên cho AI agent.
- Framework-agnostic (Strands, LangGraph, CrewAI), model-agnostic.
- Session isolation qua microVM (CPU/mem/filesystem riêng, sanitize sau khi xong).
- Extended execution tới 8 giờ (khác Lambda 15 phút).
- Consumption-based pricing: chỉ tính CPU khi active, KHÔNG tính lúc I/O wait (chờ LLM/tool).
- Giới hạn: 2 vCPU / 8GB RAM mỗi session; Docker image 2GB; code package 250MB nén.
- Built-in auth qua AgentCore Identity (Token Vault) cho outbound.
- Async/long-running: agent trả "đã bắt đầu" rồi xử lý nền, user check lại sau.

### AgentCore platform gồm

Runtime (host), Memory (context dài hạn), Gateway (API→MCP tool), Identity (credential/token vault), Observability (logging/monitoring), built-in tools.

## 8. Strands Agents SDK — kiến thức nền

- SDK mã nguồn mở của AWS, model-driven, xây agent vài dòng code.
- Dùng production trong AWS (Amazon Q Developer, AWS Glue, VPC Reachability Analyzer).
- v1.0 (7/2025): multi-agent orchestration + A2A protocol.
- Trong diagram: cặp "AgentCore Runtime + Strands Agent" = 1 khối (Runtime = hạ tầng, Strands = code chạy trong đó) → KHÔNG nối 2 icon này bằng mũi tên.

## 9. A2A Protocol (Agent-to-Agent)

- Cho phép 1 AgentCore Runtime gọi Runtime khác.
- `InvokeAgentRuntime` API — cần IAM `bedrock-agentcore:InvokeAgentRuntime`.
- JSON-RPC 2.0: `method: message/send`, response có `artifacts`.
- Payload binary tới 100MB, streaming response.
- Session: `runtimeSessionId` — dùng lại giữ context (cho retry), tạo mới cho stateless. UUID ≥ 33 ký tự.
- Capability manifest (agent card): `can`, `needs`, `meta`.
- TinyFish/Apify KHÔNG tự gọi InvokeAgentRuntime được (là API bên thứ 3) → phải qua agent relay hoặc webhook + Lambda.

## 10. IAM — least privilege (theo doc AgentCore)

- Nguyên tắc: execution role quyền = hoặc < user invoke; đặc biệt quan trọng vì LLM sinh code tùy ý (rủi ro prompt injection).
- **Role Crawler**: chỉ `s3:PutObject` trên bucket cụ thể (chỉ ghi, không đọc/xóa).
- **Role Management**: chỉ `s3:GetObject` (đọc để retry, không ghi).
- **Analysis**: không cần quyền S3 (nhận data qua payload).
- Tách role riêng từng Runtime (không dùng chung) → giới hạn blast radius nếu bị compromise.
- Resource ARN giới hạn cụ thể bucket/secret, KHÔNG wildcard `*`.
- **Cách vẽ IAM**: KHÔNG vẽ như node có mũi tên network (IAM là permission tĩnh gắn resource). Dùng annotation nhỏ dưới mỗi compute, hoặc note box.

## 11. CloudWatch vs CloudTrail

- **CloudWatch**: app logs, metrics, debug/monitor performance. Nối mũi tên đứt nét từ mọi compute (Lambda, các Runtime).
- **CloudTrail**: audit "ai gọi API AWS nào, khi nào". Mặc định ghi management events 90 ngày miễn phí. Cần Trail riêng (lưu S3) cho compliance dài hạn. KHÔNG cần mũi tên từ từng compute (tự ghi toàn account).
- Cả 2 quan trọng cho wealth management (compliance, phát hiện injection gọi sai API).

## 12. Tối ưu chi phí (Cost Optimization)

- 100% serverless (Lambda + DynamoDB On-Demand + AgentCore consumption-based) — không trả phí khi idle.
- Amplify Hosting: tính theo build-minute + GB served.
- Cognito free tier 50,000 MAU.
- API Gateway HTTP API (rẻ hơn REST ~70%).
- S3 Intelligent-Tiering: tự tối ưu tier, không phí retrieval.
- Secrets Manager cho credential (lưu ý: từng cân nhắc SSM Parameter Store SecureString miễn phí, nhưng bản chốt dùng Secrets Manager).
- Bedrock On-Demand (theo token), không Provisioned Throughput.
- Langfuse Cloud (SaaS) thay tự host ECS Fargate + RDS + Redis.
- AgentCore không tính phí lúc I/O wait (chờ TinyFish/Apify/LLM).
- Filter data bằng code trước khi vào model → tiết kiệm token Bedrock.
- Event-driven, tránh polling.
- Cảnh báo: mỗi InvokeAgentRuntime là 1 session (có overhead). Tách 3 Runtime tốn hơn 1 agent gộp — chỉ tách khi thực sự cần độc lập/tái sử dụng.

## 13. Nguyên tắc vẽ diagram (draw.io)

- Dịch vụ ngoài (TinyFish/Apify/Langfuse): dùng logo thật (image shape), đặt NGOÀI boundary AWS.
- Cặp Runtime + Strands Agent = 1 khối, không nối mũi tên nội bộ.
- Guardrails: lồng trong Strands Agent, không mũi tên network.
- IAM: annotation/note, không node network.
- CloudTrail: note, không mũi tên từ compute.
- Request đồng bộ tool: 2 mũi tên (request + response) về đúng Step gọi, nét liền.
- A2A: mũi tên 2 chiều riêng (invoke + response), không mũi tên 2 đầu.
- Decision/rule: hình thoi (rhombus).
- 7 steps của 1 agent: vẽ trong 1 container (page/tab riêng zoom-in), numbered circles, chỉ step có gọi external mới có mũi tên xuyên biên.
- Trace export Langfuse: nét đứt màu tím, "async trace export".
- Webhook: endpoint API Gateway riêng, không dùng chung endpoint user-facing.

## 14. Chuẩn AWS tham chiếu (Well-Architected Agentic AI Lens & FSI Lens)

- **Responsible agentic AI**: bounded autonomy, transparency/explainability (log+trace), human oversight (tiered theo risk/reversibility), goal alignment (eval), organizational sustainability.
- **Security**: least privilege cho agent actions, guardrails chống prompt injection, server-side validation tại tool usage, version-controlled prompt catalog, separation of duties.
- **Operational Excellence**: human-in-the-loop cho critical process, model versioning/rollback, adversarial testing, agent monitoring dashboards.
- **Observability**: OpenTelemetry (OTel) integrate AgentCore Observability với CloudWatch/Langfuse; capture inputs, reasoning steps, outputs, tool usage.
- **Reliability**: graceful degradation, failover, fallback agent/human handoff giữ context, fault injection testing.

## 15. Điểm còn mở / cần xác nhận

1. **Vai trò Management**: dùng model reasoning để route (cần Guardrails) hay chỉ if/else (bỏ Guardrails ở Management)? → quyết định vị trí Guardrails.
2. Crawler có dùng model reasoning không → có cần Guardrails ở Crawler không.
3. Kết quả hiển thị: nội dung dài (cần S3) hay tóm tắt ngắn (chỉ DynamoDB)?
4. Số lần retry tối đa (đề xuất 2).
5. Critique do Langfuse tự sinh (LLM-as-Judge) hay Lambda gọi Bedrock riêng để tạo.

## 16. File liên quan

- `market-restructuring-theme-architecture.drawio` — bản vẽ kiến trúc chính.

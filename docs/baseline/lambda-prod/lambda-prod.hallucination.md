---
baseline_schema: "2.0"
pack: "lambda-prod"
document: "hallucination"
status: "draft"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Production Lambda Functions - Decisions and Rationale

## Closed Decisions

### C3: Prohibition of Direct Lambda-to-Lambda and Runtime-to-Worker Calls
- Decision: Lambda functions must never invoke other Lambda functions directly, and runtimes must never call worker runtimes directly.
- Why: Prevents tight synchronous coupling, cascading timeouts, and unmonitored failure propagation across compute boundaries.
- What breaks if ignored: Distributed call stacks fail synchronously, double-billing compute during I/O wait and obscuring error origin in CloudWatch.
- Rejected alternative: Direct invocation via `lambda:InvokeFunction` - rejected due to fragility, hidden latency accumulation, and failure cascading.

### C10: Atomic Retry Counter in DynamoDB
- Decision: The retry count in `PipelineState` must be incremented using an atomic DynamoDB update expression (`ADD retry_count :inc`).
- Why: Guarantees concurrency safety during rapid webhook retries without distributed locks.
- What breaks if ignored: Read-modify-write patterns produce race conditions, causing duplicate retry loops that breach the retry ceiling.
- Rejected alternative: Client-side increment in Lambda memory - rejected because concurrent deliveries overwrite each other's counts.

### C11: Reflexion Retry Loop via Langfuse Webhook
- Decision: Implement self-correction by triggering Bedrock AgentCore `InvokeAgentRuntime` with critique and reused `runtimeSessionId` from the Lambda Webhook-Handler.
- Why: Preserves execution context across attempts while keeping AgentCore isolated from unauthenticated external callers.
- What breaks if ignored: Retries start as blank sessions that repeat previous reasoning flaws instead of self-correcting.
- Rejected alternative: Option A (triggering a fresh execution session without critique) - rejected because blind retries repeat the exact same hallucination or formatting error.

### C13: HMAC-SHA256 and Timestamp Verification for Webhooks
- Decision: The Langfuse webhook receiver must verify HMAC-SHA256 signatures and timestamp freshness before processing payloads.
- Why: Authenticates webhook origin and blocks replay attacks on the ingestion endpoint.
- What breaks if ignored: Malicious actors can spoof LLM evaluation results or replay historical payloads to trigger unintended agent execution.
- Rejected alternative: Relying on API Gateway URL secrecy alone - rejected because endpoint URLs leak across logs and lack origin authenticity.

### C14: AppSync Read Resolver with S3 Presigned URLs
- Decision: The AppSync resolver queries metadata from DynamoDB `MarketThemes` and generates short-lived S3 presigned URLs strictly for `final_s3_key`.
- Why: Offloads heavy binary file downloads from API compute directly to S3 while enforcing least-privilege temporal access.
- What breaks if ignored: Returning large payload bodies through Lambda and AppSync exhausts execution memory and increases network billing.
- Rejected alternative: Streaming file bodies through Lambda - rejected due to unnecessary compute costs and payload size limits.

### C15: Asymmetric Write and Read Order
- Decision: Write operations must persist to S3 before DynamoDB, whereas read operations query DynamoDB before accessing S3.
- Why: Guarantees that metadata in DynamoDB always references an existing, durable S3 artifact.
- What breaks if ignored: Writing DynamoDB first creates dangling references if subsequent S3 object storage fails or throttles.
- Rejected alternative: Atomic two-phase commits across S3 and DynamoDB - rejected as unnecessary complexity for eventual consistency patterns.

### C19: Serverless HTTP API Gateway Compute Architecture
- Decision: Expose Lambda entrypoints via Amazon API Gateway HTTP API instead of REST API.
- Why: Reduces gateway operational costs by roughly 70% while providing lower latency for serverless workloads.
- What breaks if ignored: REST API incurs higher per-request cost and slower cold-start latency with unused enterprise features.
- Rejected alternative: REST API Gateway - rejected due to higher cost and unnecessary complexity for serverless webhook ingestion.

### C20: Separation of Webhook and User Authentication
- Decision: Enforce Cognito User Pool authentication on user API endpoints and HMAC cryptographic signing on webhook endpoints.
- Why: Segregates human user identities from external SaaS machine-to-machine integrations.
- What breaks if ignored: Attempting to authenticate SaaS webhooks via Cognito breaks standard webhook delivery protocols.
- Rejected alternative: Single unified Cognito authorizer for all endpoints - rejected because third-party webhook dispatchers cannot perform SRP or OAuth flows.

## Open Questions

### O4: Maximum Retry Count Ceiling
- Question: What is the exact numerical ceiling for automated Reflexion retries before escalating to human review?
- Context: Each retry incurs Bedrock model inference costs and execution latency.
- Options: 2 retries (recommended default) vs 3 retries.
- Trade-offs: 2 retries balances recovery probability against cost runaway; 3 retries increases edge-case recovery but risks higher token spend.

### O5: Source of Evaluation Critique
- Question: Should the critique payload be extracted directly from Langfuse webhook evaluation events or generated via a dedicated Bedrock call?
- Context: The Webhook Handler needs structured feedback to pass to `InvokeAgentRuntime`.
- Options: Direct extraction from Langfuse LLM-as-Judge payload (recommended) vs secondary Lambda Bedrock call.
- Trade-offs: Direct extraction adds zero compute latency; secondary Bedrock call offers custom tailoring at the expense of additional token cost and timeout risk.


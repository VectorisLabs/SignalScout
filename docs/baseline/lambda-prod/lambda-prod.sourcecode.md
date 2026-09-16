---
baseline_schema: "2.0"
pack: "lambda-prod"
document: "sourcecode"
status: "draft"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Production Lambda Functions - Source Code Specification

## Code Topology

```
signalscout-prod/lambdas/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── handlers/
    │   ├── webhook-handler.ts
    │   ├── agent-trigger.ts
    │   └── resolver.ts
    ├── lib/
    │   ├── hmac.ts
    │   ├── dynamodb.ts
    │   ├── s3.ts
    │   └── agentcore.ts
    └── types/
        ├── events.ts
        └── state.ts
```

## Handler Interfaces and Contracts

### 1. Langfuse Webhook Handler (`src/handlers/webhook-handler.ts`)
- Inbound Trigger: API Gateway HTTP API `POST /webhooks/langfuse`.
- Auth Mechanism: `X-Langfuse-Signature` (HMAC-SHA256) and `X-Langfuse-Timestamp` headers evaluated against secret loaded from Secrets Manager (`C13`, `C17`).
- External Dependencies: `@aws-sdk/client-dynamodb`, `@aws-sdk/client-s3`, `@aws-sdk/client-bedrock-agentcore`.
- Execution Sequence:
  1. Validate signature using `src/lib/hmac.ts`; return 401 if invalid or timestamp skewed by > 300 seconds.
  2. Parse event payload extracting `run_id`, `session_id`, `score`, and `critique`.
  3. Execute atomic increment on DynamoDB `PipelineState` table: `UpdateItem` with `UpdateExpression = "ADD retry_count :inc, SET updated_at = :now"`.
  4. Write attempt payload to S3 Intelligent-Tiering bucket: `PutObject` at key `raw-market-news/{run_id}/attempt-{retry_count}.json`.
  5. If score is below acceptance threshold and `retry_count <= MAX_RETRIES`, call `bedrock-agentcore:InvokeAgentRuntime` forwarding critique and reusing `runtimeSessionId`.
  6. If `retry_count > MAX_RETRIES`, update DynamoDB status to `needs_human_review` (INV-12).

### 2. AgentCore Trigger Handler (`src/handlers/agent-trigger.ts`)
- Inbound Trigger: API Gateway HTTP API `POST /api/v1/analyze`.
- Auth Mechanism: Amazon Cognito User Pool JWT authorizer (`C20`).
- Execution Sequence:
  1. Validate request parameters and generate conforming UUID session identifier (min 33 characters).
  2. Initialize run record in DynamoDB `PipelineState` with `status = "processing"`, `retry_count = 0`.
  3. Invoke Management agent runtime via `bedrock-agentcore:InvokeAgentRuntime`.
  4. Return synchronous acceptance response carrying `run_id` and `session_id`.

### 3. AppSync Lambda Resolver (`src/handlers/resolver.ts`)
- Inbound Trigger: AWS AppSync GraphQL query `getMarketThemes(themeId: ID!)`.
- Auth Mechanism: AppSync IAM or Cognito authorization.
- Execution Sequence:
  1. Query DynamoDB `MarketThemes` table for theme record matching `themeId`.
  2. Extract `final_s3_key` from record attributes.
  3. Generate time-limited S3 presigned GET URL (15-minute expiry) for the client (`C14`).
  4. Return GraphQL response payload with metadata and presigned URL.

## Current Implementation Status
All production Lambda compute components remain in pending implementation status. The source directory `signalscout-prod/lambdas/` currently contains only `.gitkeep`, with infrastructure integration points provisioned in Terraform.


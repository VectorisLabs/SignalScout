---
baseline_schema: "2.0"
pack: "lambda-prod"
document: "roadmap"
status: "draft"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Production Lambda Functions - Roadmap

## Phases

### Phase 1: Tooling and Workspace Scaffolding
- Scope: Establish TypeScript build tooling, package configuration, and offline unit test harness under `signalscout-prod/lambdas/`.
- Status: draft
- Dependencies: None
- Acceptance Criteria: `signalscout-prod/lambdas/package.json` configured with TypeScript, `@aws-sdk/client-dynamodb`, `@aws-sdk/client-s3`, `@aws-sdk/client-bedrock-agentcore`, and Vitest test runner executing cleanly.
- Verification Gate: `npm run build` and `npm test` execute within the workspace without errors.

### Phase 2: Langfuse Webhook Handler Implementation
- Scope: Implement HMAC-SHA256 signature verification, timestamp anti-replay validation, atomic DynamoDB retry tracking, and S3 attempt storage.
- Status: draft
- Dependencies: Phase 1
- Acceptance Criteria: Handler correctly rejects invalid signatures with 401, rejects timestamps older than 5 minutes, updates `PipelineState` with `ADD retry_count :inc`, and writes `raw-market-news/{run_id}/attempt-{n}.json` to S3.
- Verification Gate: Unit test suite covering valid signatures, expired timestamps, malformed payloads, and atomic increment expressions.

### Phase 3: AgentCore Invocation and Reflexion Dispatcher
- Scope: Integrate AWS SDK client for Bedrock AgentCore Runtime to trigger initial analysis and execute retry re-invocations.
- Status: draft
- Dependencies: Phase 2
- Acceptance Criteria: Handler evaluates evaluation score against threshold; on failure below retry ceiling (O4), invokes `bedrock-agentcore:InvokeAgentRuntime` forwarding critique and reusing `runtimeSessionId`; on exceeding ceiling, marks state as `needs_human_review`.
- Verification Gate: Unit tests validating session ID propagation, critique payload formatting, and terminal error routing.

### Phase 4: AppSync Resolver and AgentCore Trigger Handlers
- Scope: Implement the GraphQL resolver for `getMarketThemes` queries and the user-facing API Gateway trigger handler.
- Status: draft
- Dependencies: Phase 1
- Acceptance Criteria: Resolver fetches metadata from `MarketThemes` DynamoDB table and generates S3 presigned URLs for `final_s3_key`; trigger handler validates Cognito claims and launches a new AgentCore session.
- Verification Gate: Unit tests asserting presigned URL expiry settings, parameter validation, and GraphQL response structure.

## Risks and Open Questions
- O4 in `docs/production/decision-ledger.md`: Maximum retry count ceiling requires explicit numerical confirmation (proposed default is 2).
- O5 in `docs/production/decision-ledger.md`: Source of critique payload on retry (direct evaluation extraction from Langfuse LLM-as-Judge webhook event vs dedicated Bedrock evaluation call).

## Next Action
- Initialize `package.json`, `tsconfig.json`, and Vitest unit testing dependencies under `signalscout-prod/lambdas/`.


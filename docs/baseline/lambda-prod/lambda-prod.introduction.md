---
baseline_schema: "2.0"
pack: "lambda-prod"
document: "introduction"
status: "draft"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Production Lambda Functions - Introduction

## Scope
This documentation pack governs the serverless compute handlers, event ingestion pipelines, and GraphQL data resolvers for the production deployment of SignalScout under `signalscout-prod/lambdas/` using TypeScript. It defines the implementation requirements, event contracts, verification procedures, and security controls for the serverless tier connecting external webhooks, frontend clients, data persistence, and Bedrock AgentCore runtimes.

## Current Truth
The production code directory `signalscout-prod/lambdas/` currently contains only `.gitkeep`. Infrastructure prerequisites are established in `signalscout-prod/terraform/modules/api_gateway_compute`, providing Amazon API Gateway HTTP API routes, IAM execution roles, and CloudWatch log groups.

Authoritative architectural specifications in `docs/production/architecture.md` and `docs/production/decision-ledger.md` define three discrete Lambda functions operating across the request lifecycle: the Langfuse Webhook Handler, the AgentCore Trigger Handler, and the AppSync Lambda Resolver.

## Target
1. Langfuse Webhook Handler: Implement a secure receiver for Langfuse LLM-as-Judge scoring webhooks. The handler validates HMAC-SHA256 signatures with timestamp checks against replay attacks (C13, C20), executes atomic retry increments in DynamoDB `PipelineState` via `ADD retry_count :inc` (C10), persists raw attempt payloads to S3 Intelligent-Tiering under `raw-market-news/{run_id}/attempt-{n}.json` (C8, C15), and triggers Reflexion retries by calling `InvokeAgentRuntime` with the critique payload and reused `runtimeSessionId` (C11).
2. AgentCore Trigger Handler: Implement the entrypoint function triggered by the user-facing HTTP API Gateway authenticated via Cognito (Flow 1, C20). It initializes run execution metadata, generates a conforming UUID session identifier, and initiates the supervisor flow on the Management agent via `bedrock-agentcore:InvokeAgentRuntime`.
3. AppSync Lambda Resolver: Implement the data resolver for GraphQL `getMarketThemes` queries (Flow 3, C14). It queries the DynamoDB `MarketThemes` table for analysis results and generates S3 presigned URLs strictly for `final_s3_key` to allow direct, secure client downloads.

## Constraints
- Runtime Environment: Node.js 20.x with TypeScript, bundled with zero ambient dependencies.
- Decoupling Discipline: Absolutely no Lambda-calls-Lambda chains; functions decouple through EventBridge, S3 bucket notifications, API Gateway, or supervisor runtimes (C3).
- Security Boundaries: Webhook endpoints enforce signature verification with secrets loaded from AWS Secrets Manager, completely separated from user Cognito pools (C13, C17, C20).
- State and Retry Invariants: Retry counters must be atomic to prevent race conditions, bounded by a strict retry ceiling before escalating to `needs_human_review` (C10, C11, INV-12).


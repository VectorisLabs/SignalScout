---
baseline_schema: "2.0"
pack: "agentcore-prod"
document: "introduction"
status: "draft"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Production Bedrock AgentCore Runtimes - Introduction

## Scope
This documentation pack governs the implementation of the multi-agent intelligence tier for SignalScout hosted on Amazon Bedrock AgentCore Runtime under `signalscout-prod/agents/` using Python managed with `uv`. It defines the supervisor-worker orchestration framework, Strands Agents SDK integration, Agent-to-Agent (A2A) communication protocols, external tool invocation bindings, data sanitization boundaries, Bedrock Guardrails attachment, and Langfuse tracing integration.

## Current Truth
The production code directory `signalscout-prod/agents/` currently contains only `.gitkeep`. The live demonstration runs on the hackathon POC in `signalscout-poc/` using the OpenAI Responses API.

The target production architecture is authoritatively specified in `docs/production/architecture.md`, `docs/production/design-rationale.md`, and `docs/reference/aws-agent-platform.md`. The design establishes three dedicated AgentCore Runtimes operating in a supervisor-worker star topology: Management (supervisor), Crawler (worker), and Analysis (worker).

## Target
1. Management Supervisor Agent: Implements the central orchestration logic using the Strands Agents SDK. It handles incoming requests via `InvokeAgentRuntime`, executes sequential worker calls across the star topology (first Crawler, then Analysis), maintains session continuity across Reflexion retries via `runtimeSessionId`, and exports trace metadata to Langfuse. Management delegates all persistence writes to the downstream Lambda Webhook-Handler (S2).
2. Crawler Worker Agent: Implements external intelligence collection using model-invoked tools (`tool_use`) reaching TinyFish and Apify directly over HTTPS (C4, C5). It executes strict server-side filtering, HTML stripping, and prompt-injection pattern sanitization in pure Python code (C7) before returning structured JSON to the supervisor.
3. Analysis Worker Agent: Implements LLM-driven thematic extraction and sentiment synthesis over sanitized intelligence feeds. The agent runtime is protected by mandatory Amazon Bedrock Guardrails to mitigate hallucination and prompt injection risks on model inputs and outputs (C12, INV-13).
4. Langfuse Observability Integration: Implements asynchronous OpenTelemetry and Langfuse SDK export for all agent steps, supporting prompt versioning, token usage tracking, and automated LLM-as-Judge scoring pipelines.

## Constraints
- Toolchain: Strict dependency and environment management using `uv` and `uvx`, with no reliance on legacy ambient python3 toolchains.
- Architectural Topology: Enforce star topology orchestration; worker runtimes must never invoke each other directly (C2, C3).
- Content Sanitization: Server-side code sanitization is mandatory in Crawler before web data reaches any model inference step (C7, INV-13).
- Security Guardrails: Bedrock Guardrails must attach to the Analysis agent runtime without exception (C12).
- Network Access: Outbound HTTPS calls to TinyFish and Apify execute directly from AgentCore Runtime microVMs without intervening proxies or gateways (C4).


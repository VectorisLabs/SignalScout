---
baseline_schema: "2.0"
pack: "agentcore-prod"
document: "sourcecode"
status: "draft"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Production Bedrock AgentCore Runtimes - Source Code Specification

## Code Topology

```
signalscout-prod/agents/
├── pyproject.toml
├── uv.lock
├── tests/
│   ├── test_crawler_sanitizer.py
│   ├── test_analysis_agent.py
│   └── test_management_orchestration.py
└── src/
    ├── management/
    │   ├── __init__.py
    │   ├── supervisor.py
    │   └── orchestration.py
    ├── crawler/
    │   ├── __init__.py
    │   ├── worker.py
    │   ├── tools.py
    │   └── sanitizer.py
    ├── analysis/
    │   ├── __init__.py
    │   ├── worker.py
    │   └── prompts.py
    └── common/
        ├── __init__.py
        ├── models.py
        ├── secrets.py
        └── telemetry.py
```

## Strands Agent Interfaces and Protocols

### 1. Management Supervisor (`src/management/supervisor.py`)
- Hosting Environment: Bedrock AgentCore Runtime (supervisor instance).
- Entrypoint Method: `handle_request(event, context)`.
- Invocation API: Initiated by Lambda Trigger Handler or Webhook Handler via `bedrock-agentcore:InvokeAgentRuntime`.
- Orchestration Protocol: Calls Crawler worker runtime, then calls Analysis worker runtime sequentially using the A2A JSON-RPC 2.0 protocol (`method: message/send`).
- Session Continuity: Reuses inbound `runtimeSessionId` across Reflexion retries to preserve evaluation context.
- Telemetry: Emits asynchronous trace spans to Langfuse using `src/common/telemetry.py`.

### 2. Crawler Worker (`src/crawler/worker.py`)
- Hosting Environment: Bedrock AgentCore Runtime (isolated microVM).
- Invocation API: Called strictly by Management runtime via A2A protocol (`InvokeAgentRuntime`).
- Tool Calling: Implements function calling bindings (`tool_use`) for TinyFish (investor relations, press releases) and Apify (news scraping, SEC filings) reaching endpoints directly over HTTPS.
- Sanitizer Subsystem: Executes deterministic pure Python sanitization in `src/crawler/sanitizer.py` (HTML tag stripping, injection regex pattern neutralizers, max character clamping, payload schema enforcement) before outputting JSON payload (`C7`).

### 3. Analysis Worker (`src/analysis/worker.py`)
- Hosting Environment: Bedrock AgentCore Runtime (worker instance).
- Invocation API: Called strictly by Management runtime via A2A protocol passing sanitized JSON payload.
- Model Binding: Instantiates `BedrockModel` configured with Amazon Bedrock Guardrail identifier and version loaded from environment variables (`C12`).
- Inference Output: Forces structured JSON schema output containing theme title, sentiment analysis, confidence score, and supporting evidence citations.

## Current Implementation Status
All Bedrock AgentCore runtime components are in pending implementation status. The source directory `signalscout-prod/agents/` currently contains only `.gitkeep`, with infrastructure IAM roles and guardrail configurations defined in Terraform.


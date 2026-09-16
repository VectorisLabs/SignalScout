---
baseline_schema: "2.0"
pack: "agentcore-prod"
document: "roadmap"
status: "draft"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Production Bedrock AgentCore Runtimes - Roadmap

## Phases

### Phase 1: Python Workspace and Tooling Initialization
- Scope: Establish Python workspace packaging, lockfile, and test runner under `signalscout-prod/agents/` using `uv`.
- Status: draft
- Dependencies: None
- Acceptance Criteria: `signalscout-prod/agents/pyproject.toml` configured with Python >=3.11, Strands Agents SDK, `boto3`, `langfuse`, `pydantic`, and `pytest`; virtual environment reproducible via `uv sync`.
- Verification Gate: `uv run pytest` executes cleanly within the workspace.

### Phase 2: Crawler Worker Agent and Intelligence Ingestion
- Scope: Implement Crawler worker agent with model-invoked tool bindings to TinyFish and Apify, paired with server-side pure Python sanitization.
- Status: draft
- Dependencies: Phase 1
- Acceptance Criteria: Crawler executes tool calls bounded by `max_duration_seconds` (C5), sanitizes raw payloads (stripping script tags, normalizing encoding, truncating excessive inputs, stripping injection delimiters) in pure code (C7), and returns structured JSON schema without model reasoning over raw untrusted text (O2).
- Verification Gate: Unit test suite asserting HTML sanitization, injection neutralization, timeout handling, and schema validation.

### Phase 3: Analysis Worker Agent and Guardrails Integration
- Scope: Implement Analysis worker agent performing structured thematic correlation and sentiment classification under Bedrock Guardrails protection.
- Status: draft
- Dependencies: Phase 1
- Acceptance Criteria: Agent configures `BedrockModel` with attached Amazon Bedrock Guardrail (C12), processes sanitized intelligence feeds, and emits typed JSON outputs conforming to the target schema.
- Verification Gate: Unit tests asserting schema conformance, prompt evaluation, and Guardrails intercept behavior against test injection fixtures.

### Phase 4: Management Supervisor Agent and A2A Orchestration
- Scope: Implement Management supervisor agent orchestrating sequential worker invocations via A2A protocol and exporting telemetry to Langfuse.
- Status: draft
- Dependencies: Phase 2, Phase 3
- Acceptance Criteria: Management invokes Crawler then Analysis sequentially across star topology (C1, C2), propagates `runtimeSessionId` across Reflexion retries, handles worker failure responses, and exports asynchronous traces to Langfuse.
- Verification Gate: End-to-end integration tests with mocked AgentCore Runtime A2A endpoints verifying full orchestration loop.

## Risks and Open Questions
- O1 in `docs/production/decision-ledger.md`: Confirmation whether Management supervisor requires Bedrock Guardrails (Option A: drop if pure code routing; Option B: keep for defense-in-depth if model synthesizes worker results).
- O2 in `docs/production/decision-ledger.md`: Confirmation that Crawler operates strictly without a model (Option A: tool calls + code sanitization only, recommended).

## Next Action
- Initialize `pyproject.toml` and configure dependencies using `uv init` in `signalscout-prod/agents/`.


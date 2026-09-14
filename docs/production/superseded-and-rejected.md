# Superseded and Rejected - Production Architecture

> **Scope: production.** The register of options that were considered and dropped, and of statements that were overtaken by a later decision. It exists so that a rejected option is not re-proposed, and so that a stale statement found in an old document can be recognized as stale.

**Extracted from:** the project research record - the former root-level `MEMORY.md` (2026-07-12), deleted on 2026-09-14 once its content was distributed into these documents. Section numbers below refer to that file as it stood.

Architecture decisions moved fast during the hackathon research, so the original research record accumulated statements that contradict each other. Every contradiction found during the extraction is listed here with the resolution applied. Where a resolution was not derivable from a closed decision, it is listed as **unresolved** rather than guessed.

---

## 1. Rejected options

Each of these was actively considered and dropped. Do not re-propose without new evidence.

| # | Option rejected | In favour of | Reason | Source |
|---|---|---|---|---|
| R1 | **S3 Glacier Instant Retrieval** with a manual lifecycle policy | S3 Intelligent-Tiering | Access pattern is unpredictable - objects are re-read only on retry or audit, never on a schedule. Intelligent-Tiering moves tiers automatically with no retrieval fee and instant read-back. | research record §4.8 |
| R2 | **SSM Parameter Store SecureString** (free tier) | AWS Secrets Manager | Considered for cost, but Secrets Manager was chosen in the final design. Note: the original record does not state the deciding reason; rotation support and the webhook signing secret are the likely drivers. | research record §12 |
| R3 | **AgentCore Gateway / MCP** in front of TinyFish and Apify | Direct HTTPS from AgentCore Runtime | Gateway earns its place only with multiple agents sharing a tool, centralized audit or rate limiting, or an MCP tool to expose. With one agent and one tool it is over-engineering. | research record §4.3, ledger C4 |
| R4 | **Lambda as an intermediary** for outbound calls to TinyFish/Apify | Runtime calls HTTPS directly | AgentCore Runtime has its own network and reaches both public and private resources. A Lambda hop adds cost and latency with no benefit. | research record §4.3 |
| R5 | **A separate Lambda for data filtering** after the collector returns | Filtering inside the Crawler Runtime code | Avoids a redundant network hop; the filter is plain Python and does not need its own compute boundary. | research record §4.5 |
| R6 | **Lambda-calls-Lambda** and **worker-Runtime-calls-worker-Runtime** | Decouple via the supervisor or an S3 event | Double-billing of wait time, tight coupling, independent retry and scaling become hard, and infinite loops become possible. | research record §4.1, ledger C3 |
| R7 | **Browser reads S3 directly** | Lambda resolver issues a presigned URL | S3 stays private; making the bucket public is a security hole. | research record §4.13, ledger C14 |
| R8 | **Read-then-write** on `retry_count` | DynamoDB atomic counter (`ADD retry_count :inc`) | Concurrent webhook deliveries lose updates. | research record §4.10, ledger C10 |
| R9 | **Self-hosted Langfuse** (ECS Fargate + RDS + Redis) | Langfuse Cloud | Three always-on components against a SaaS tier, for a workload that is entirely event-driven. | research record §12 |
| R10 | **Bedrock Provisioned Throughput** | Bedrock On-Demand | No sustained load to amortize a commitment against. | research record §12 |
| R11 | **API Gateway REST API** | HTTP API | HTTP API is roughly 70% cheaper and the REST-only features are not needed. | research record §12, ledger C19 |
| R12 | **Sharing the user-facing API Gateway** for the Langfuse webhook | A separate webhook endpoint | The user-facing endpoint carries a Cognito authorizer; Langfuse cannot present a JWT. Signature verification replaces it on a dedicated endpoint. | research record §5, ledger C13/C20 |
| R13 | **Retry option A** in the Reflexion loop | Option B - re-trigger `InvokeAgentRuntime` with a critique, reusing the session | Recorded only as "Option B chosen". **What option A was is not recorded anywhere.** See gap G1 below. | research record §4.9, ledger C11 |

## 2. Statements overtaken by a later decision

These appear in the original research record (and may appear in other old documents) but no longer describe the current design. They are corrected in the extracted documents; this table records what changed so the old wording is recognizable.

| # | Stale statement | Where it came from | Current position |
|---|---|---|---|
| S1 | "Storing raw data in S3 is **not required** for the pipeline to run - data can travel in the `InvokeAgentRuntime` payload." | research record §4.7 | Overtaken. S3 storage is settled and mandatory: Intelligent-Tiering, multi-attempt, never overwritten (§4.8, §4.12, ledger C8). §4.7 survives only as the *reasoning* for why storing was chosen - replay without re-paying the collector, compliance, debug. |
| S2 | "Management writes the result (S3 + DynamoDB)." | research record §2, processing-flow block | Contradicts the read/write block four lines below it in the same section, and §4.14. The **Lambda Webhook-Handler** performs the write, S3 first then DynamoDB, triggered by the Langfuse webhook. Management does not write. Corrected in [`architecture.md`](./architecture.md). |
| S3 | "Wealth management suggests flagging for human review, **but** the user chose Option B (auto retry)." | research record §5 | Misleading. The two are not alternatives: Option B *includes* human review as its terminal state - after `MAX_RETRY` the item is flagged `needs_human_review` (§4.9). Auto-retry did not replace human oversight, it bounds it. Corrected in [`design-rationale.md`](./design-rationale.md#langfuse-integration). |
| S4 | The five open questions in the research record §15. | research record §15 | Not stale in substance, but no longer live here. They are O1-O5 in [`decision-ledger.md`](./decision-ledger.md), which carries the full options and trade-offs. That section held one line each; do not treat it as the current statement of the question. |
| S5 | The Guardrails placement table with two empty "reason" cells, plus the note "still to be settled: whether Management uses model reasoning". | research record §6 | Same content as O1 and O2 in [`decision-ledger.md`](./decision-ledger.md). [`design-rationale.md`](./design-rationale.md#guardrails-and-sanitization) keeps the settled row (Analysis is mandatory) and points to the ledger for the two open rows rather than restating them. |
| S6 | "Diagram format: draw.io (`.drawio`)" and "`market-restructuring-theme-architecture.drawio` - the main architecture drawing". | research record §1, §16 | **The `.drawio` file does not exist in this repository.** What exists is [`../assets/architect-v1.png`](../assets/architect-v1.png) and [`../assets/architect-v2.jpeg`](../assets/architect-v2.jpeg). The drawing conventions in [`architecture.md`](./architecture.md#diagram-conventions) are preserved for a future redraw, but there is no editable source to apply them to. |

## 3. Unresolved conflicts and gaps

Not guessed at during extraction. Each needs a decision or a lookup before it can be closed.

| # | Issue | Why it matters | What would close it |
|---|---|---|---|
| G1 | **Retry option A is unrecorded.** The ledger says Option B was chosen (C11) but no document says what Option A was. | A rejected option with no recorded reason gets re-proposed. Most likely candidates: a Step Functions retry loop, or having Langfuse re-invoke Analysis directly rather than going back through Management. | Recall or re-derive what A was, and add it to table 1 above. |
| G2 | **§4.6 does not actually settle how the provider is chosen.** It describes both a hard-coded `if/else` before the model call *and* a rule in the system prompt letting the model choose - without picking one. Ledger C6 records it as closed ("rule / tool_use inside the Crawler"), which covers both readings. | The shared policy [`../collector-routing-rules.md`](../collector-routing-rules.md) is explicit that the model must **not** name a provider, so routing stays deterministic and changeable without touching prompts. If production intends the opposite, that divergence should be deliberate, not accidental. | Pick one. See [`tool-invocation.md`](./design-rationale.md#tool-invocation-and-data-filtering) for the two readings side by side. |
| G3 | **AgentCore Memory appears in the service inventory but in no flow.** §3 lists it as "short-term memory / session context, read and written by Management, not Lambda", yet neither the orchestration flow nor any C-decision mentions it. | Either it is part of the design and the flows are incomplete, or it was dropped and the inventory is stale. | Confirm whether Management uses AgentCore Memory, or remove it from the inventory. |
| G4 | **WAF appears in the service inventory but in no flow or decision.** Listed as "protects the frontend/API tier" with no placement. | Same shape as G3: an entry with no owner. | Confirm whether WAF sits in front of Amplify, the API Gateway, or both. |
| G5 | **The Bedrock model id in the Guardrails snippet is unverified.** §6 shows `global.anthropic.claude-sonnet-4-6`. | Model ids and the current generation change often; the snippet is a copy target, so a wrong id fails at runtime. | Check the current Bedrock model catalogue before using the snippet, and pin a deliberate model choice. |
| G6 | **Third-party API facts carry an implicit verification date of 2026-07-12.** The TinyFish sync endpoint, the Apify 5-minute sync ceiling, and the AgentCore session limits in [`../reference/`](../reference/) all date from then. | These were correct at research time and drift silently. | Re-verify against vendor documentation before building, and set a `last_verified` date on each reference document. |
| G7 | **No closed decision implements the Evidence Gate in production.** BD-01 in [`../business/README.md`](../business/README.md) settled that the gate is a business requirement, not a POC mechanism - the earlier note in the production copy of the collector policy excluding it from production was wrong and has been corrected in [`../collector-routing-rules.md`](../collector-routing-rules.md). | Until a `Cxx` row places the gate, the production design does not satisfy INV-03, INV-04 and INV-05 in [`../business/domain-invariants.md`](../business/domain-invariants.md), and its outputs are not admissible under the same rules the POC already meets. | Decide where GATE-01 to GATE-12 run in the supervisor-worker flow - inside Crawler after sanitization, as a step in Management before Analysis, or in the Webhook-Handler before the write - and close it as a new `Cxx`. |

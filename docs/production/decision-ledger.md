# SignalScout Production Architecture - Decision Ledger

**Status:** authoritative for production architecture decisions
**Last updated:** 2026-07-12
**Authority:** this file is where a production decision is settled. The reasoning behind each row lives in the rationale documents listed in [`README.md`](./README.md); the diagram is [`../assets/architect-v1.png`](../assets/architect-v1.png).

The production target is a **multi-agent supervisor-worker system on Bedrock AgentCore** (Management / Crawler / Analysis) over DynamoDB + S3, with Langfuse-driven retry. This file is the single place a decision is opened or closed. A rationale document explains a decision but never changes its status.

This is **not** what currently runs. The running demo is the OpenAI Responses API POC in [`../poc/`](../poc/). The superseded first-pass plan is archived at [`../archive/hackathon-plan-v1.md`](../archive/hackathon-plan-v1.md).

---

## A. Closed decisions

| # | Decision | Rationale |
|---|---|---|
| C1 | **Multi-agent supervisor-worker** on Bedrock AgentCore: Management (supervisor) → Crawler + Analysis (workers) | [architecture-overview](./architecture.md) |
| C2 | Supervisor orchestrates in a **star topology**: Management calls A, then calls B; A and B are **never** wired directly to each other | [agent-orchestration](./design-rationale.md#agent-orchestration) |
| C3 | **No** Lambda-calls-Lambda and **no** Runtime-calls-worker-Runtime directly; decouple through the supervisor or an S3 event | [agent-orchestration](./design-rationale.md#agent-orchestration) |
| C4 | AgentCore Runtime calls TinyFish/Apify **directly over HTTPS**; AgentCore Gateway / MCP is **not** used (over-engineering for one agent with one tool) | [agent-orchestration](./design-rationale.md#agent-orchestration) |
| C5 | TinyFish/Apify are **model-invoked tools (tool_use)** on the sync endpoint, bounded by `max_duration_seconds` (no cancel available) | [tool-invocation](./design-rationale.md#tool-invocation-and-data-filtering) |
| C6 | TinyFish vs Apify is chosen by **rule / tool_use inside the Crawler** - there is **no** separate "Collector Router" service | [tool-invocation](./design-rationale.md#tool-invocation-and-data-filtering) - see G2, not fully settled |
| C7 | **Filter and sanitize in plain code** (pure Python) inside the Crawler before anything reaches the model - saves tokens, blocks injection | [tool-invocation](./design-rationale.md#tool-invocation-and-data-filtering), [guardrails](./design-rationale.md#guardrails-and-sanitization) |
| C8 | **S3 Intelligent-Tiering** for raw content and results; store **every attempt, never overwrite** (`raw-market-news/{run_id}/attempt-{n}.json`) | [data-and-storage](./design-rationale.md#data-and-storage) |
| C9 | **DynamoDB On-Demand**, split across two tables: `MarketThemes` (display, exposed via AppSync) and `PipelineState` (operational, never exposed) | [data-and-storage](./design-rationale.md#data-and-storage) |
| C10 | `retry_count` uses an **atomic counter** (`ADD retry_count :inc`) | [retry-loop](./design-rationale.md#retry-and-self-correction) |
| C11 | Retry / self-correction (**Reflexion**) via **Langfuse webhook → dedicated API Gateway → Lambda Webhook-Handler**; **Option B**: re-trigger `InvokeAgentRuntime` carrying a `critique` and reusing the existing session; a retry ceiling is **mandatory** | [retry-loop](./design-rationale.md#retry-and-self-correction) |
| C12 | **Guardrails are mandatory on Analysis** - that is where untrusted web content enters model reasoning | [guardrails](./design-rationale.md#guardrails-and-sanitization) |
| C13 | Langfuse provides prompt management, tracing, LLM-as-Judge scoring and webhooks; the webhook **must verify HMAC + timestamp**; the webhook endpoint is **separate and does not use Cognito** | [langfuse-integration](./design-rationale.md#langfuse-integration) |
| C14 | Dashboard read path: **Amplify → AppSync → Lambda resolver → DynamoDB → S3 presigned URL → browser downloads directly**; presigned URLs are issued only for `final_s3_key` | [data-and-storage](./design-rationale.md#data-and-storage) |
| C15 | The **write** order (S3 → DynamoDB) differs from the **read** order (DynamoDB → S3); they are two separate lifecycles | [data-and-storage](./design-rationale.md#data-and-storage) |
| C16 | IAM is **least-privilege** with a **separate role per Runtime**, explicit ARNs, **no wildcards** | [iam-least-privilege](./operations.md#iam-and-least-privilege) |
| C17 | **Secrets Manager** holds the API keys (TinyFish/Apify/Langfuse) and the webhook signing secret | [service-inventory](./architecture.md#service-inventory), [cost-optimization](./operations.md#cost-optimization) |
| C18 | Observability: **CloudWatch** (logs, metrics, alarms) + **CloudTrail** (audit and compliance) | [observability](./operations.md#observability) |
| C19 | **100% serverless** with cost optimization: HTTP API (~70% cheaper than REST), Bedrock On-Demand, Langfuse Cloud, filtering before the model, no charge during I/O wait | [cost-optimization](./operations.md#cost-optimization) |
| C20 | Auth: **Cognito** for the user-facing API Gateway; the webhook endpoint **verifies a signature** instead of using Cognito | [langfuse-integration](./design-rationale.md#langfuse-integration) |

## B. Open decisions

Detailed analysis for each is in section C below.

| # | Open question | Rationale |
|---|---|---|
| O1 | Guardrails on **Management** - keep or drop? (depends on whether Management uses model reasoning to route) | [guardrails](./design-rationale.md#guardrails-and-sanitization) |
| O2 | Guardrails on **Crawler** - needed at all? (depends on whether Crawler uses model reasoning) | [guardrails](./design-rationale.md#guardrails-and-sanitization) |
| O3 | Display-result storage: **S3** (long content) or **DynamoDB only** (short summaries)? | [data-and-storage](./design-rationale.md#data-and-storage) |
| O4 | **Maximum retry count** (proposed: 2) - fix the number | [retry-loop](./design-rationale.md#retry-and-self-correction) |
| O5 | Source of the **critique** on retry: generated by Langfuse LLM-as-Judge, or a separate Bedrock call from Lambda? | [retry-loop](./design-rationale.md#retry-and-self-correction) |

---

## C. Open decisions - detailed analysis

Each entry gives the context, the options, the trade-offs, and a recommendation. When one is settled, move it from table B to table A with a new `Cxx` id and record the date and the decision owner.

### O1 - Guardrails on Management (supervisor)

**Context:** Bedrock Guardrails is a property attached to the `BedrockModel` a Strands Agent uses - not a separate network service. Guardrails only does anything when that runtime actually **calls a model to read or synthesize content**. The core question: does Management use model reasoning to orchestrate, or does it just run if/else routing logic?

**Options:**

| Option | When it is right | Guardrails |
|---|---|---|
| A. Management **orchestrates in code only** (if/else, reads metadata, calls InvokeAgentRuntime) | Simple flow with a fixed Crawler → Analysis order | **Drop** - no model call, so Guardrails is meaningless |
| B. Management **uses model reasoning** to pick which worker to call, to merge outputs and write summaries | Flexible orchestration is needed and Management re-reads worker output, which may carry web data that passed through Analysis | **Keep** - merged content can still carry residual injection |

**Trade-offs:**
- Dropping Guardrails on Management is simpler, cheaper and lower-latency; but if Management later starts reading untrusted content and nobody re-enables it, that is a hole.
- Keeping Guardrails is safer by defense-in-depth, at the cost of a Guardrails call plus small latency on every Management model call.

**Recommendation:** Settle the Management role first. If Management **only routes metadata already sanitized by a worker** → **option A (drop)**. If Management **writes its own summaries or decides based on content** → **option B (keep)**. For wealth management, a sensitive domain, lean to **B** when in doubt for the extra defense-in-depth layer.

**Needed to close:** confirm whether Management has a `BedrockModel` plus a reasoning system prompt, or is pure orchestration code.

### O2 - Guardrails on Crawler

**Context:** Crawler receives raw JSON from TinyFish/Apify - **untrusted** web data with high prompt-injection risk. The design already settles that Crawler **sanitizes in plain code** (strip HTML, detect injection patterns, validate schema, truncate) **before** any content touches a model. The question: does Crawler have a model-reasoning step at all?

**Options:**

| Option | Description | Guardrails |
|---|---|---|
| A. Crawler is **tool calls + code sanitization only** (no model call) | Calls TinyFish/Apify, then filters in Python | **Not needed** - no model call; server-side sanitization is the protective layer |
| B. Crawler **has a model** (for example, it summarizes or classifies sources before returning to Management) | There is a reasoning step over raw web content | **Required** - this is an untrusted-into-model boundary with high injection risk |

**Trade-offs:**
- Option A matches the current design: sanitize in code, filter without spending tokens. Simple, cheap, and consistent with the "filter before the model" principle.
- Option B is only justified if a model is genuinely needed at the collection layer; then Guardrails becomes mandatory and code sanitization is still required first.

**Recommendation:** Keep Crawler as **tool calls + code sanitization (option A)**, exactly as §4.5 specifies. Do not put a model in Crawler; concentrate all reasoning in Analysis, which already has mandatory Guardrails (C12). This keeps the boundary clean: Crawler collects and cleans in code, Analysis reasons behind Guardrails.

**Needed to close:** confirm Crawler has no `BedrockModel`. If a model is ever added to Crawler, enable Guardrails at the same time.

### O3 - Display-result storage: S3 or DynamoDB only

**Context:** DynamoDB caps items at 400KB. Theme-detection results shown on the Advisor Dashboard could be short summaries (theme + sentiment + a few lines) or long content (full analysis, evidence lists, quotations).

**Options:**

| Option | When it is right | Consequence |
|---|---|---|
| A. **DynamoDB only** (short summaries) | Display payload stays well under a few hundred KB, no long quotations needed | The presigned-URL path (C14) drops out of the main display flow → simpler architecture |
| B. **DynamoDB (metadata) + S3 (long content)** | Full analysis and long evidence are needed, plus replay and audit | Keeps the presigned-URL path; reuses the multi-attempt S3 store (C8/C12) as the display source too |
| C. **Hybrid** | Short summary in DynamoDB for the list view; S3 for the detail view when a user opens one theme | Balanced: fast list, complete detail |

**Trade-offs:**
- A is simplest and lowest-latency, but hits the 400KB ceiling if content grows.
- B is flexible for large content and reuses the S3 audit trail, but adds a presigned-URL hop to every detail read.
- C gives the best user experience (light list, complete detail) but requires a clear definition of which field lives where.

**Recommendation:** **Option C (hybrid).** `MarketThemes` in DynamoDB holds the fast-display summary (theme, sentiment, score, `final_s3_key`); S3 holds the long analysis that the detail view fetches via presigned URL. This reuses the already-settled multi-attempt S3 store (C8/C12) as both detail source and audit trail, with no new store introduced.

**Needed to close:** measure the typical display payload size and confirm whether a long detail view is required.

### O4 - Maximum retry count (MAX_RETRY)

**Context:** The Reflexion loop (C11) requires a retry ceiling to avoid infinite loops and runaway LLM cost. The original research proposed **2**.

**Options:**

| MAX_RETRY | Trade-off |
|---|---|
| 1 | Cheapest and fastest to respond; but gives the agent only one chance to self-correct, missing cases that would have been fixed on the second attempt |
| **2 (proposed)** | Balanced: enough room for meaningful self-correction; worst case is 3 runs (original + 2 retries) |
| 3+ | Higher chance of reaching a passing score; but cost and latency grow linearly, and if the second attempt did not fix it, the third rarely will |

**Additional trade-off:** every retry must carry a **`critique`** (C11) - without it, raising the retry count just repeats the same failure and burns money.

**Recommendation:** Fix **MAX_RETRY = 2**. If the score is still below threshold after two retries, flag `needs_human_review`, consistent with wealth management practice of human oversight on hard cases. Keep MAX_RETRY in **config/env**, never hard-coded, so it can be tuned against real Langfuse data (pass rate at retry 1 vs retry 2).

**Needed to close:** confirm the number 2 and the mechanism for putting it in config.

### O5 - Source of the critique on retry

**Context:** The retry payload must carry a `critique` (verbal feedback), not just the original data (C11). Where does that critique come from?

**Options:**

| Option | Description | Trade-off |
|---|---|---|
| A. **Generated by Langfuse LLM-as-Judge** | The Judge emits both the score and the reasoning/critique; Webhook-Handler reads the critique alongside the score | Reuses a step that already exists, with no extra model call; depends on Judge critique quality and the Langfuse response schema |
| B. **Separate Bedrock call from Lambda** | Webhook-Handler makes one dedicated Bedrock call to generate a critique from the output plus score | Better control over the critique prompt, decoupled from the Judge; adds a model call (cost + latency) plus code and an IAM role |
| C. **Combined** | Use the Judge critique when it is good enough, fall back to a Bedrock call when the Judge returns only a raw score | Most flexible, most complex |

**Trade-offs:**
- A is simple, cheap, and has fewest moving parts - consistent with the cost-optimization principle (§12) and with avoiding redundant network hops.
- B produces more consistent critique quality and format, but costs more and grants Bedrock permissions to the Webhook-Handler Lambda, widening the blast radius against least-privilege (C16).
- C is best on quality but has the most code paths to test.

**Recommendation:** **Option A (Langfuse LLM-as-Judge generates the critique).** Configure the Judge to return both `score` and `critique` as structured verbal feedback: weaknesses plus suggested fixes. Keep the Webhook-Handler Lambda thin - read DynamoDB, check `retry_count`, call `InvokeAgentRuntime` with the critique - which stays least-privilege and low-cost. Escalate to B only if measurement shows the Judge critique does not steer the agent to a fix.

**Needed to close:** confirm the Langfuse Judge output schema contains a critique field, and that critique quality is sufficient for self-correction.

---

## How to close an open decision

1. Move the entry from **table B (open)** to **table A (closed)** with a new id (`Cxx`).
2. Record the date it was closed and who decided.
3. If the decision changes the architecture drawing, update [`../assets/architect-v1.png`](../assets/architect-v1.png), and update the rationale document that explains it.
4. If the decision invalidates an option, record that option and its reason in [`superseded-and-rejected.md`](./superseded-and-rejected.md) so it is not re-proposed.

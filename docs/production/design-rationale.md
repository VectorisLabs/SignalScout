# Design Rationale

> **Scope: production.** Why the pipeline works the way it does, domain by domain. Each section names the ledger rows it explains. This document **explains** decisions; it never changes their status - that happens only in [`decision-ledger.md`](./decision-ledger.md).

| Section | Ledger rows |
|---|---|
| [Agent orchestration](#agent-orchestration) | C1-C4 |
| [Tool invocation and data filtering](#tool-invocation-and-data-filtering) | C5-C7 |
| [Data and storage](#data-and-storage) | C8, C9, C14, C15 |
| [Retry and self-correction](#retry-and-self-correction) | C10, C11 |
| [Langfuse integration](#langfuse-integration) | C13, C20 |
| [Guardrails and sanitization](#guardrails-and-sanitization) | C12 |

---

## Agent orchestration

### No Lambda chaining, no worker-calls-worker

**Decision:** A Lambda never invokes another Lambda, and a worker Runtime never invokes another worker Runtime. Decoupling goes through the supervisor, or through an S3 event.

**Reasoning:** A synchronous chain bills the waiting time twice - the caller stays alive doing nothing while the callee works. It also couples the two tightly, makes independent retry and scaling hard, and opens the door to infinite loops.

Ledger: C3. Rejected option: R6.

### The supervisor orchestrates in a star, A never calls B

**Decision:** Management calls Crawler, then calls Analysis. Crawler and Analysis are never connected to each other.

**Reasoning:** AWS Well-Architected Agentic AI Lens, AGENTPERF05-BP02 - supervisor-worker is the pattern when centralized quality control is needed. Errors are controlled in one place, handoffs are traceable, and workers stay reusable because they carry no knowledge of each other.

Ledger: C1, C2.

### AgentCore Runtime calls external APIs directly

**Decision:** Code inside AgentCore Runtime makes its own outbound HTTPS calls to TinyFish and Apify. No Lambda in between, and no AgentCore Gateway.

**Reasoning:** AgentCore Runtime has its own network and can reach both public and private resources, so a Lambda hop adds cost and latency for nothing.

AgentCore Gateway is only worth it when several agents share a tool, when audit or rate limiting must be centralized, or when an MCP tool needs to be exposed. With one agent calling one tool, it is over-engineering.

Ledger: C4. Rejected options: R3, R4.

> This is the main thing separating the production design from the POC. The POC routes provider selection through an application-side Collector Router; production puts the choice inside the Crawler and calls the provider directly. Both are bound by one shared policy - see the Version bindings table in [`../collector-routing-rules.md`](../collector-routing-rules.md).

---

## Tool invocation and data filtering

**Third-party facts in this section were verified 2026-07-12** and have not been re-checked since. See G6 in [`superseded-and-rejected.md`](./superseded-and-rejected.md).

### TinyFish and Apify are model-invoked tools

**Decision:** Both run when model reasoning decides to call a tool - function calling inside the Strands Agent.

| Provider | Endpoint | Constraint |
|---|---|---|
| TinyFish | `POST https://agent.tinyfish.ai/v1/automation/run` (sync) | Blocks and returns the result in the same HTTP response. **No cancel support** - bound it with `max_duration_seconds`. |
| Apify | "Run Actor synchronously and get dataset items" | Only usable when the Actor finishes in under 5 minutes. |

The response returns to exactly the step that made the call, over the same HTTP connection. It does not arrive by another path.

Ledger: C5.

### Filter in plain code, before the model

**Decision:** After raw JSON arrives from TinyFish/Apify, filter it with plain Python **before** any of it reaches the model. The filter lives in the AgentCore Runtime code, not in a separate Lambda.

**Reasoning:** AgentCore reading JSON costs almost nothing - compute is cheap. Feeding raw JSON to the model is what costs: heavy Bedrock token spend from response bloat, and measurably worse accuracy. Putting the filter in its own Lambda would add a network hop for no gain.

**Techniques:** dictionary key filtering, HTML stripping (trafilatura), truncation to roughly 3000 characters, dedup and schema validation.

This is also the primary defence against prompt injection, not just a cost measure - see [Guardrails and sanitization](#guardrails-and-sanitization).

Ledger: C7. Rejected option: R5.

### Provider selection - the unresolved part

**Ledger C6 records this as closed:** TinyFish vs Apify is chosen by rule or `tool_use` inside the Crawler, with no separate Collector Router service.

**But the original record describes two different mechanisms without choosing between them:**

| Reading | Mechanism | Consequence |
|---|---|---|
| A | Hard-coded `if/else` in Crawler code, evaluated **before** the model call | Routing is deterministic and can change without touching any prompt |
| B | A rule in the system prompt; the model picks the provider during reasoning | Routing is flexible but changes require prompt edits, and the choice is not reproducible |

The shared policy [`../collector-routing-rules.md`](../collector-routing-rules.md) is explicit that the model must **not** name a provider, precisely so routing stays deterministic - that is reading A. If production intends reading B, the divergence should be deliberate.

**Not resolved.** Tracked as G2 in [`superseded-and-rejected.md`](./superseded-and-rejected.md).

The full routing policy - when collection may be requested at all, budget bounds, authoritative-source preference, audit fields - is [`../collector-routing-rules.md`](../collector-routing-rules.md).

---

## Data and storage

### Why store raw data at all

Raw collector output does not have to be persisted for the pipeline to function - it can travel in the `InvokeAgentRuntime` payload. It is persisted anyway, for three reasons:

1. **Replay on retry** - a retry re-reads the stored attempt instead of paying TinyFish/Apify again.
2. **Compliance and audit** - a regulated domain needs the evidence trail.
3. **Debugging** and building an evaluation dataset from real attempts.

The original record still reads as an open question here ("not required... should be stored if..."). It is not open: C8 settles it, and the above survives only as the reasoning. See S1 in [`superseded-and-rejected.md`](./superseded-and-rejected.md).

**Size rule:** under a few hundred KB can live in DynamoDB (400KB item ceiling); larger goes to S3.

### S3 - Intelligent-Tiering, multi-attempt, never overwritten

**Storage class: Intelligent-Tiering.** The access pattern is unpredictable - objects are re-read only on retry or audit, never on a schedule. Tiers move automatically (Frequent, then Infrequent Access after 30 days, then Archive Instant Access after 90 days), with no retrieval fee and instant read-back. Chosen over Glacier Instant Retrieval with a hand-written lifecycle policy (R1).

**Key layout:** `raw-market-news/{run_id}/attempt-{n}.json`

Every attempt is written as a new object. Nothing is ever overwritten, which preserves the history for debugging, evaluation datasets and compliance. Intelligent-Tiering demotes old attempts on its own, so the cost of keeping them stays small.

Ledger: C8.

### DynamoDB - two tables, deliberately separated

| Table | Contents | Exposed via AppSync |
|---|---|---|
| `MarketThemes` | Display data | **Yes** - Amplify reads it |
| `PipelineState` | `retry_count`, `session_id`, `critique`, `status` | **No** |

**Reasoning:** operational state must not leak to the frontend, and the two have different access patterns. Capacity mode is On-Demand.

`MarketThemes` also carries `final_s3_key` (the attempt that succeeded) and `retry_history` (short metadata for each attempt).

Ledger: C9. See also O3 in [`decision-ledger.md`](./decision-ledger.md) - whether long display content lives in S3 or only in DynamoDB is still open.

### Serving S3 content to the browser

The bucket is private and stays private; making it public would be a security hole (R7). Instead:

1. The Lambda resolver generates a presigned URL (`get_object`, expiring in roughly 1 hour).
2. It returns that URL to Amplify.
3. The browser downloads straight from S3 - it does not proxy back through Lambda or AppSync a second time.

**Presigned URLs are issued only for `final_s3_key`**, never for an attempt that scored badly.

Ledger: C14.

### Write order is the reverse of read order

| Direction | Lambda | Order | Reason |
|---|---|---|---|
| **Write** | Webhook-Handler | S3 first, then DynamoDB | Prevents DynamoDB pointing at an object that does not exist yet |
| **Read** | AppSync resolver | DynamoDB first, then S3 | The `s3_key` must be known before a presigned URL can be generated |

These are **two separate lifecycles**, not one chain: the write happens when the pipeline finishes, the read when a user opens the dashboard. They should not be drawn as a single sequence.

Ledger: C15.

---

## Retry and self-correction

The Reflexion pattern: Analysis finishes, exports its trace and an LLM-as-Judge score to Langfuse, and Langfuse decides which branch fires.

**High score** - webhook `score.high` fires:

```
Langfuse -> webhook -> Lambda -> S3 (PutObject) -> DynamoDB (UpdateItem) -> visible in Amplify
```

**Low score** - a Langfuse monitor crosses its alert threshold:

```
Langfuse -> webhook -> API Gateway (dedicated endpoint) -> Lambda Webhook-Handler
    read retry_count from DynamoDB (atomic counter)
    if retry_count <  MAX  -> InvokeAgentRuntime back into Management,
                              carrying critique, reusing the existing session
    if retry_count >= MAX  -> flag needs_human_review
```

`MAX` is proposed as 2 and not yet fixed - that is O4 in [`decision-ledger.md`](./decision-ledger.md).

### Two things that are mandatory

**Every retry must carry a `critique`** - verbal feedback, not just the original data. Without it the agent repeats the same mistake and the extra run buys nothing. Where the critique comes from is O5 in [`decision-ledger.md`](./decision-ledger.md), still open.

**The retry count must be bounded.** An unbounded Reflexion loop is an unbounded bill.

Ledger: C11. The chosen direction is recorded as "Option B - re-trigger `InvokeAgentRuntime`". What Option A was is not recorded anywhere; see G1 in [`superseded-and-rejected.md`](./superseded-and-rejected.md).

### `retry_count` uses an atomic counter

```
UpdateExpression: 'ADD retry_count :increment'
```

Never read-then-write. Concurrent webhook deliveries would lose updates and the loop would run past its ceiling.

Ledger: C10. Rejected option: R8.

### Auto-retry did not replace human review

The original record phrases these as alternatives - "wealth management suggests flagging for human review, **but** the user chose Option B (auto retry)". That reading is wrong and should not be carried forward.

Option B **ends** in human review: after `MAX_RETRY` the item is flagged `needs_human_review`. Auto-retry bounds the human queue, it does not eliminate it - which is the behaviour a regulated domain wants. See S3 in [`superseded-and-rejected.md`](./superseded-and-rejected.md).

---

## Langfuse integration

### Langfuse is not only a trace sink

Three mechanisms push data back out of Langfuse into the system:

| Mechanism | What it does |
|---|---|
| **Prompt Management** | The app fetches prompts from Langfuse at runtime, versioned, with SDK-level caching. Langfuse becomes a configuration source, not just an observer. |
| **Webhooks** | Langfuse POSTs a notification when a prompt or score changes - this is what drives the retry loop and can trigger CI/CD or sync jobs. |
| **Scores / Feedback API** | Evaluations are ingested back into Langfuse: Numeric, Categorical, Boolean or Text. |

The webhook mechanism is what makes the Reflexion loop possible without polling.

### Webhook requirements

**Components:** a dedicated API Gateway endpoint (`POST /webhooks/langfuse`), the Lambda Webhook-Handler, a signing secret in Secrets Manager, and DynamoDB.

**Mandatory, not optional:**

- **Verify the HMAC signature** on every request - this is the only thing preventing a forged retry trigger.
- **Check the timestamp** (roughly a 5-minute window) to block replays.

**The endpoint must be separate from the user-facing API Gateway.** The user-facing one carries a Cognito authorizer, and Langfuse cannot present a JWT. Signature verification replaces Cognito on this endpoint - which is exactly why it cannot be skipped.

Ledger: C13, C20. Rejected option: R12.

### Evaluation

- **LLM-as-a-Judge** scores the output automatically; a human annotation queue is the alternative path.
- **Monitors and alerts** fire on score thresholds - a warning threshold and an alert threshold.

The alert threshold is what triggers the low-score branch of the retry loop.

---

## Guardrails and sanitization

### Bedrock Guardrails is a model property, not a service in the network path

Guardrails attaches to the `BedrockModel` that a Strands Agent uses. It applies automatically whenever that agent calls the model. There is no separate hop, no endpoint, nothing to route through.

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

> **Verify `model_id` before using this snippet.** It was recorded on 2026-07-12 and model identifiers change between generations. Tracked as G5 in [`superseded-and-rejected.md`](./superseded-and-rejected.md).

The consequence for diagrams: nest the Guardrails icon inside or against the Strands Agent, with no two-way arrow - unless the standalone `ApplyGuardrail` API is being used, which it is not here. See [`architecture.md`](./architecture.md#diagram-conventions).

### Where Guardrails goes

| Runtime | Guardrails | Status |
|---|---|---|
| Management | Depends on whether the supervisor uses model reasoning over untrusted content, or only routes metadata | **Open** - O1 in [`decision-ledger.md`](./decision-ledger.md) |
| Crawler | Probably not needed: tool calls only, with code-level sanitization already in place | **Open** - O2 in [`decision-ledger.md`](./decision-ledger.md) |
| **Analysis** | **Mandatory** | **Closed** - C12 |

Analysis is mandatory because it is the point where untrusted web content enters model reasoning. That is the highest injection risk in the system.

The two open rows are not restated here - their options, trade-offs and recommendations live in [`decision-ledger.md`](./decision-ledger.md), which is the single place they get updated when settled. See S5 in [`superseded-and-rejected.md`](./superseded-and-rejected.md).

### Server-side sanitization is code, not a service

Inside the Crawler, immediately after data arrives from TinyFish/Apify and **before** anything reaches a model:

- strip HTML and script content
- detect injection patterns
- validate against the expected schema
- truncate

Web data is untrusted and can carry hidden prompt injection. This runs unconditionally, whether or not Guardrails is enabled anywhere.

On a diagram this is a plain rectangle inside the Crawler, with no AWS icon - it is application code, not a service.

### The two layers are not interchangeable

Code sanitization runs first and catches structural attacks cheaply, without spending tokens. Guardrails runs at the model boundary and catches what survives. Ledger C7 (sanitize in code) and C12 (Guardrails on Analysis) are both required - neither substitutes for the other.

# Domain Invariants

> **Scope: business.** What must be true of SignalScout regardless of stack, provider or deployment target. These statements survive a full rewrite. Technical choices that implement them live in [`../production/decision-ledger.md`](../production/decision-ledger.md) and in the POC documents; they never weaken an invariant here.

An invariant is either **in force** or **retired with a recorded reason**. It is never "open" - open technical questions belong in the decision ledger.

---

## 1. Invariants

| # | Invariant | Statement | Breaks if ignored |
|---|---|---|---|
| INV-01 | **Temporal integrity** | An evidence item is visible only when `publicly_available_at <= as_of`. Public availability is the gate, never the event date or the fiscal period end. | Hindsight leakage - a replay looks prescient because it used information published later |
| INV-02 | **Outcome isolation** | A known later outcome may appear only after its own public date and can never influence an earlier frame, score, maturity value or model prompt. | The retrospective becomes circular and unfalsifiable |
| INV-03 | **Claim integrity** | Every factual claim references one or more approved evidence IDs. A claim with no resolvable evidence is rejected, not rewritten as fact. | Hallucinated citations - a citation that exists but does not support the sentence attached to it |
| INV-04 | **Source integrity** | Every evidence and metric observation resolves to a source ID that exists in the source registry. | Untraceable numbers in a regulated output |
| INV-05 | **Rights integrity** | A public artifact carries only rights-reviewed excerpts and metadata, never an unrestricted page dump. | Content-rights exposure |
| INV-06 | **Deterministic authority** | Code - not a model - owns score, stage, readiness and blocking reasons. A model drafts explanations; deterministic validation decides whether they are admissible. | Conclusions drift between runs and cannot be reproduced or audited |
| INV-07 | **Missing-data honesty** | An unavailable metric produces a visible blocker, never an inferred or interpolated value. | A decision section presents itself as ready on data it does not have |
| INV-08 | **Scenario humility** | Cost, benefit, risk and impact outputs are structured decision support, not certified forecasts or autonomous recommendations. | The product is read as a predictor and used to authorize actions it never evaluated |
| INV-09 | **Replay reproducibility** | Identical frozen input produces identical output. | Nothing downstream can be verified or diffed |
| INV-10 | **Graceful degradation** | Failure of any external provider never breaks the primary user path. | The product is only as available as its least reliable partner |
| INV-11 | **Audit trail is first-class** | Every attempt is retained and never overwritten, and infrastructure-side API calls are auditable independently of application logs. | A regulated domain has no evidence trail, and a successful prompt injection calling an unexpected API stays invisible |
| INV-12 | **Human oversight is the terminal state** | Automatic correction is bounded. At the bound the item is flagged for human review; it is never dropped, looped forever, or silently approved. | An unbounded loop, an unbounded bill, and no accountable decision maker |
| INV-13 | **Untrusted content near a model is the primary risk** | Retrieved content is data, never instruction. It is sanitized in plain code before it reaches a model; model-boundary filtering is an additional layer, not a substitute. | Prompt injection reaches reasoning, and any excess permission becomes a reachable capability |

### Why INV-11, INV-12 and INV-13 are domain facts, not architecture preferences

The output feeds investment and commercial-exposure decisions in a regulated domain. That makes audit, human oversight and injection resistance properties of the problem, not features of one design. They are the reason for choices elsewhere in the repository that would otherwise look over-built: an audit log alongside application logs, a multi-attempt store that never overwrites, a bounded correction loop that ends in `needs_human_review`, and mandatory guardrails at the reasoning boundary.

---

## 2. Authority boundaries

Who decides what. A component may never set a field owned by another row.

| # | Actor | Owns | May never set |
|---|---|---|---|
| AUTH-01 | Conversational model | Planning, tool-request arguments, final narrative | Provider choice, evidence approval, score, stage, readiness |
| AUTH-02 | Collection routing | Provider choice, budgets, retries, stop conditions | Approval status, rights status, factual conclusions |
| AUTH-03 | External collectors | Returning candidates marked `UNTRUSTED_SOURCE_CANDIDATE` | `curator_status`, `rights_status`, verified availability time, pattern maturity, relevance, outcome eligibility |
| AUTH-04 | Evidence Gate | Schema, public URL, entity, temporal, hash, duplicate, rights and provenance checks | Narrative and scenario content |
| AUTH-05 | Observability and evaluation | Traces, scores, alerts | Approval - it records quality, it does not grant admissibility |
| AUTH-06 | Deterministic code | Score, stage, readiness, blocking reasons, bundle validity | Nothing is delegated out of this row |
| AUTH-07 | UI | Rendering, and separating approved evidence from pending or rejected candidates | Presenting a candidate as approved, or a blocked section as ready |

AUTH-05 is the row most often violated in practice: a platform that can score a run looks like it can approve one. It cannot. Scoring feeds the bounded correction loop of INV-12; admissibility comes only from AUTH-04.

---

## 3. Canonical state

There is exactly one canonical state object, `CasePackage`. Provider responses, raw fetched pages, traces and receipts are inputs or audit artifacts. The UI never reads provider output directly.

This is the mechanism behind INV-06 and INV-09: if the UI can read anything other than canonical state, deterministic authority and reproducibility are both unenforceable.

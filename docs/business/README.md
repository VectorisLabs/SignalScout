# Business Requirements

> **Scope: business.** Requirements, invariants and vocabulary that hold regardless of stack, provider or deployment target. This layer is version-independent: it is neither POC nor production.

The test for what belongs here: **a statement belongs in this folder if it would still be true after throwing away the entire implementation and rebuilding on a different stack.** If changing the model provider or the cloud platform changes the statement, it is not a business requirement and it belongs in [`../poc/`](../poc/) or [`../production/`](../production/).

## Five documents

| File | Answers |
|---|---|
| [`product-definition.md`](./product-definition.md) | **What is the product and what does it refuse to claim?** Problem, user, job-to-be-done, the three postures, outputs, differentiator, explicit non-claims |
| [`domain-invariants.md`](./domain-invariants.md) | **What must always be true?** INV-01 to INV-13, the authority boundaries AUTH-01 to AUTH-07, canonical state |
| [`evidence-policy.md`](./evidence-policy.md) | **When is collected material admissible?** Collection policy EV-01 to EV-12, Evidence Gate checks GATE-01 to GATE-12, stop conditions, prompt-injection boundary |
| [`signal-taxonomy.md`](./signal-taxonomy.md) | **What vocabulary and thresholds does the product use?** Patterns PAT-01/PAT-02, signal types, maturity policies, metrics MET-01 to MET-14, readiness sections RDY-01 to RDY-05 |
| [`scope-and-nongoals.md`](./scope-and-nongoals.md) | **What is deliberately out of scope, and what can never be cut?** NOGO-01 to NOGO-09, the non-negotiable core |

## Authority

1. **For a domain statement or invariant, this folder outranks both [`../poc/`](../poc/) and [`../production/`](../production/).** An implementation document may explain or implement a requirement here; it may not restate it differently, and it may not relax it.
2. **For a technical choice, [`../production/decision-ledger.md`](../production/decision-ledger.md) outranks this folder.** Nothing here opens or closes a technical decision.
3. **A requirement has no open state.** It is in force, or retired with a recorded reason. Options and trade-offs belong in the decision ledger, which is where `Cxx` and `Oxx` rows live.

Cite by ID from implementation documents rather than copying text. A second copy of a requirement is a future contradiction.

## Provenance

Extracted 2026-09-14 from [`../poc/build-guide.md`](../poc/build-guide.md), [`../collector-routing-rules.md`](../collector-routing-rules.md), [`../poc/openai-chat-implementation-plan.md`](../poc/openai-chat-implementation-plan.md), [`../poc/showcase-dataset-research.md`](../poc/showcase-dataset-research.md), [`../poc/submission-claims.md`](../poc/submission-claims.md), [`../production/architecture.md`](../production/architecture.md) and [`../proposal/master-proposal.md`](../proposal/master-proposal.md).

The extraction **moved** content. Each source section was replaced with a one-line citation, not left in place as a second copy. This repository has already paid for the duplicate-source-of-truth problem once, during the `MEMORY.md` extraction recorded in [`../production/superseded-and-rejected.md`](../production/superseded-and-rejected.md).

Deliberately **not** moved here, because they are version- or demo-specific: the Bed Bath & Beyond evidence records and their timestamps, the fictional entity-context field values and relevance rules, provider-specific routing thresholds, the POC must-ship list and cut order, and the per-capability submission claims ledger.

## Decisions taken during extraction

| # | Decision | Reason | Consequence |
|---|---|---|---|
| BD-01 | The Evidence Gate is a **general business requirement**, not a POC-only mechanism | Three invariants (claim, rights and temporal integrity) depend on it, and a regulated-domain output cannot drop its evidence chain on the way to production | The line in the production collector policy stating that the Evidence Gate "does not apply to production" was wrong and has been corrected in [`../collector-routing-rules.md`](../collector-routing-rules.md). Production now inherits GATE-01 to GATE-12 and has no closed decision implementing them - tracked as G7 in [`../production/superseded-and-rejected.md`](../production/superseded-and-rejected.md) |
| BD-02 | Numeric maturity thresholds live here, labelled with their calibration | There is exactly one calibration today; separating the concept from the number is the fastest route to drift between the two versions | [`signal-taxonomy.md`](./signal-taxonomy.md) section 5 carries the calibration owner and freeze date |
| BD-03 | The truthful-claim **principle** lives here; the per-capability claims table stays in the POC | The principle outlives the hackathon submission; the table does not | [`product-definition.md`](./product-definition.md) section 8 |

## Unresolved

| # | Issue |
|---|---|
| BU-01 | Provider-selection mechanism is still unsettled in production (G2 in [`../production/superseded-and-rejected.md`](../production/superseded-and-rejected.md)). This layer is deliberately provider-neutral, so it does not resolve G2 - but EV-01 and AUTH-01 do constrain it: authoritative sources are preferred, and the model does not own provider choice. A production reading in which the model selects a provider from a prompt rule satisfies neither constraint cleanly. |
| BU-02 | Production has no closed decision implementing the Evidence Gate (G7), following BD-01. Until it does, the production design does not satisfy INV-03 to INV-05. |

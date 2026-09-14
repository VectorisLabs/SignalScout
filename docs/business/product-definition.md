# Product Definition

> **Scope: business.** What SignalScout is, who it is for, what decision it serves, and what it explicitly does not claim. Stack-independent.

---

## 1. Problem

Corporate change signals are fragmented across filings, financial disclosures, store and facility actions, workforce changes, financing events, leadership moves and news. A single event is noise; a cluster within a time window is a story. Teams monitoring counterparties today rely on manual search, spreadsheets, news alerts and individual judgment - slow, hard to audit, and weakest at exactly the thing that matters, connecting small signals spread across different documents and dates.

## 2. User

A strategy, competitive-intelligence, enterprise-risk, procurement, supplier-risk or commercial-exposure analyst preparing an executive decision review.

## 3. Job to be done

> "When a watched company begins restructuring, show me the evidence cluster, the financial and operating metrics affected, the plausible response scenarios, and what leadership should review next."

## 4. The decision the product serves

The executive chooses one posture:

| Posture | Meaning |
|---|---|
| `MAINTAIN` | Monitor and preserve the current plan |
| `ADAPT` | Make bounded changes to pricing, inventory, channels, footprint, supplier exposure or operating model |
| `ACCELERATE` | Act while the counterparty is distracted or structurally weakened |

These are **review postures, not autonomous decisions**. The product organizes and evidences a choice; it does not authorize closures, job actions, financing or restructuring.

## 5. Outputs

1. Evidence replay timeline.
2. Strategic pattern radar.
3. Metric coverage and missing-data warnings.
4. Restructuring scenarios.
5. Cost-benefit-risk comparison.
6. Revenue, cash-flow and operating-impact framing.
7. Executive dashboard.
8. Decision recommendation and challenger questions.

## 6. Differentiator

Every factual claim is traceable to approved evidence. Every replay view obeys time visibility. Every decision section declares whether it is ready or blocked by missing metrics. A model drafts the explanation; deterministic code decides whether that explanation is admissible.

The product also argues against itself: before producing a conclusion it records the strongest plausible benign explanation and the evidence that weakens or fails to distinguish the leading hypothesis. Uncertainty is recorded, not hidden.

## 7. Explicit non-claims

These are load-bearing. Wording anywhere in the repository, in a proposal, a demo script or a UI string, must not contradict them.

| # | Non-claim |
|---|---|
| NOCLAIM-01 | Not a bankruptcy predictor, and not a distress-prediction model. The purpose is to recognize when a cluster merits human investigation. |
| NOCLAIM-02 | No score is a calibrated probability. Thresholds are policy (see [`signal-taxonomy.md`](./signal-taxonomy.md) section 5). |
| NOCLAIM-03 | Scenarios and recommendations are decision support, not certified forecasts or autonomous recommendations (INV-08 in [`domain-invariants.md`](./domain-invariants.md)). |
| NOCLAIM-04 | A retrospective reconstruction is not a prediction of outcome, and must be labelled as retrospective wherever it is shown. |
| NOCLAIM-05 | Relevance to the user's own organization comes only from context that organization entered, never from an assumption about its confidential operations. |
| NOCLAIM-06 | Any fictional comparison entity is labelled as fictional wherever it appears. |

## 8. Truthful-claim principle

A capability is described in the past tense only when a real, sanitized receipt exists for it. Architecture discussion, a prepared adapter, a mock, a screenshot or a validate-only check is not usage, and a partner or platform is not named as used on that basis.

The concrete per-capability ledger for the hackathon submission is POC-scoped and lives in [`../poc/submission-claims.md`](../poc/submission-claims.md). The principle above outlives that submission.

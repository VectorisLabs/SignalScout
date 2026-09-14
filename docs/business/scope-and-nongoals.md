# Scope Boundaries and Non-Goals

> **Scope: business.** What the product deliberately is not, and what can never be traded away when scope is cut. Version-independent: these hold for the POC and for the production target alike. The POC's own must-ship list and cut order are delivery planning and stay in [`../poc/build-guide.md`](../poc/build-guide.md).

---

## 1. Non-goals

Each of these was excluded deliberately. Re-proposing one requires a recorded decision, not an assumption that it was simply not done yet.

| # | Non-goal | Why |
|---|---|---|
| NOGO-01 | Generalized multi-company production monitoring | The product proves evidence integrity on a deeply researched case; breadth without provenance is the thing it exists to replace |
| NOGO-02 | Real-time alerting, queues, schedulers, exactly-once ingestion | Operational machinery that does not change whether a conclusion is admissible |
| NOGO-03 | Calibrated bankruptcy or revenue forecasting | Directly contradicts NOCLAIM-01 and NOCLAIM-02 in [`product-definition.md`](./product-definition.md) |
| NOGO-04 | Autonomous restructuring recommendations | The postures are review postures; acting on them is a human decision (INV-08, INV-12) |
| NOGO-05 | Training or fine-tuning a model | Reasoning quality is not the bottleneck; evidence admissibility is |
| NOGO-06 | Full authentication, multi-tenancy, billing | Not required to demonstrate or operate the decision workflow at current scale |
| NOGO-07 | A vector database | Only on a measured requirement, never speculatively |
| NOGO-08 | Adding a platform or partner in order to list it | A capability is claimed only with a real receipt; see the truthful-claim principle in [`product-definition.md`](./product-definition.md) |
| NOGO-09 | Automated entity resolution across similarly named entities | Entity identity is a gate check (GATE-03), not an inference |

## 2. The non-negotiable core

When time, budget or scope is cut, these are never what gets cut:

- evidence provenance and claim-to-evidence resolution (INV-03, INV-04);
- temporal integrity and outcome isolation (INV-01, INV-02);
- metric blockers on unsupported decision sections (INV-07);
- fail-closed validation of any published artifact (INV-05, INV-09);
- the primary user path working without any external provider (INV-10);
- human review as the terminal state of automatic correction (INV-12).

Invariant IDs refer to [`domain-invariants.md`](./domain-invariants.md).

## 3. How a scope reduction is allowed to work

A scope cut removes a capability. It never weakens a check, relaxes a gate, or converts a blocker into a default value. If a capability cannot ship with its checks intact, it does not ship - a blocked section that says so is a correct output, and a partial answer presented as complete is not.

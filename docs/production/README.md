# Production Architecture

> **Scope: production.** The target architecture - designed, not built. What actually runs today is the POC in [`../poc/`](../poc/).

Multi-agent supervisor-worker on Bedrock AgentCore (Management / Crawler / Analysis), over DynamoDB + S3, with a Langfuse-driven retry loop.

Diagram: [`../assets/architect-v1.png`](../assets/architect-v1.png), revised in [`../assets/architect-v2.jpeg`](../assets/architect-v2.jpeg).

## Six documents

| File | Answers | Lines |
|---|---|---|
| [`architecture.md`](./architecture.md) | **What is it?** Project context, the three agents, the three flows, every service, and how the diagram is drawn | ~155 |
| [`decision-ledger.md`](./decision-ledger.md) | **What was decided?** C1-C20 closed, O1-O5 open with options and trade-offs. **The authority** | ~160 |
| [`design-rationale.md`](./design-rationale.md) | **Why does the pipeline work this way?** Orchestration, tool invocation, storage, retry, Langfuse, guardrails | ~250 |
| [`operations.md`](./operations.md) | **How is it run?** IAM, observability, cost, Well-Architected alignment | ~100 |
| [`collector-routing-rules.md`](./collector-routing-rules.md) | **When may the model collect?** `COLLECTOR-ROUTER-PROD-v1`, the full policy | ~470 |
| [`superseded-and-rejected.md`](./superseded-and-rejected.md) | **What was already ruled out?** Rejected options with reasons, stale statements, unresolved gaps | ~55 |

Platform background - AgentCore Runtime, Strands, A2A - is in [`../reference/aws-agent-platform.md`](../reference/aws-agent-platform.md).

## Reading order

1. [`architecture.md`](./architecture.md) - the shape of the system
2. [`decision-ledger.md`](./decision-ledger.md) - what is settled and what is not
3. [`design-rationale.md`](./design-rationale.md) - the reasoning behind any ledger row
4. [`superseded-and-rejected.md`](./superseded-and-rejected.md) - before proposing a change

## Before you change anything here

Decisions moved fast during hackathon research, and documents from that period contradicted each other. Two rules keep that from recurring:

1. **A decision is settled in [`decision-ledger.md`](./decision-ledger.md) and nowhere else.** [`design-rationale.md`](./design-rationale.md) explains a decision; it does not change its status. Closing an open decision means editing the ledger.
2. **A rejected option goes in [`superseded-and-rejected.md`](./superseded-and-rejected.md) with its reason.** An option dropped without a recorded reason gets re-proposed - three entries in that file exist precisely because the reason was almost lost.

## Provenance

These documents were extracted from the repository's former `MEMORY.md` on 2026-09-14, translated from Vietnamese, and consolidated. `MEMORY.md` has been deleted; nothing of it was lost. Six contradictions and six gaps were found during extraction; all are recorded in [`superseded-and-rejected.md`](./superseded-and-rejected.md) rather than silently resolved.

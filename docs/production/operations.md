# Operations

> **Scope: production.** How the system is permissioned, watched, paid for, and what AWS guidance it answers to. Ledger rows C16, C18, C19.

---

## IAM and least privilege

### The principle

An execution role must have permissions **equal to or narrower than** the user who invoked it. This matters more than usual here: the LLM can generate arbitrary code paths, so prompt injection turns any excess permission into a reachable capability.

### Role per Runtime

Each Runtime gets its own role. Sharing one role across all three would mean a compromise of any agent grants the union of all permissions.

| Runtime | S3 permission | Why |
|---|---|---|
| **Crawler** | `s3:PutObject` only, on one named bucket | Writes attempts. Never needs to read or delete them. |
| **Management** | `s3:GetObject` only | Reads a stored attempt when retrying. Never writes. |
| **Analysis** | none | Receives its data through the `InvokeAgentRuntime` payload. |

Note how the write/read split mirrors the data flow: the agent that collects cannot read back, and the agent that replays cannot overwrite. Neither can destroy the audit trail.

### Resource scoping

Every policy names specific bucket and secret ARNs. **No wildcard `*` resources.**

Ledger: C16. On diagrams, IAM is an annotation, never a node - see [`architecture.md`](./architecture.md#diagram-conventions).

---

## Observability

| | CloudWatch | CloudTrail |
|---|---|---|
| **Answers** | What did the application do, and how did it perform? | Who called which AWS API, and when? |
| **Contains** | Application logs, metrics, alarms | API call audit records |
| **Cost** | Per logs and metrics ingested | Management events free for 90 days; a dedicated Trail writing to S3 is needed for longer retention |
| **On a diagram** | Dashed arrows from every compute element (Lambda, each Runtime) | A note. No arrows - it records account-wide on its own |

### Why both matter in this domain

Wealth management needs the compliance trail, which is CloudTrail's job and not CloudWatch's. CloudTrail is also the layer that would reveal a successful prompt injection calling an AWS API it had no business calling - application logs would show a plausible-looking run, while the API audit shows the anomaly.

Langfuse covers the third view that neither provides: agent traces, reasoning steps, tool usage and scores. See [`design-rationale.md`](./design-rationale.md#langfuse-integration).

Ledger: C18.

---

## Cost optimization

### The baseline: 100% serverless

Lambda, DynamoDB On-Demand and AgentCore consumption-based pricing together mean **nothing is paid for while idle**. The whole design is event-driven; polling is avoided everywhere.

### Choices made for cost

| Choice | Saving |
|---|---|
| API Gateway **HTTP API** instead of REST | ~70% cheaper (R11) |
| **S3 Intelligent-Tiering** | Automatic tiering, no retrieval fee (R1) |
| **Bedrock On-Demand**, per token | No commitment to amortize (R10) |
| **Langfuse Cloud** instead of self-hosting | Avoids always-on ECS Fargate + RDS + Redis (R9) |
| **Filter data in code before the model** | The single largest token saving - raw JSON into Bedrock is expensive and less accurate ([`design-rationale.md`](./design-rationale.md#tool-invocation-and-data-filtering)) |
| **AgentCore bills no CPU during I/O wait** | Waiting on TinyFish, Apify or the LLM is free |
| Cognito free tier | 50,000 MAU |

**Amplify Hosting** bills on build-minutes plus GB served.

**Secrets Manager** is paid, where SSM Parameter Store SecureString would have been free. Secrets Manager was chosen anyway - see R2 in [`superseded-and-rejected.md`](./superseded-and-rejected.md), and note that the deciding reason was never written down.

### The one cost warning in the original record

**Every `InvokeAgentRuntime` call is a session, and sessions carry overhead.** Running three separate Runtimes costs more than one combined agent would.

The split is justified here by independent scaling, reuse and blast-radius isolation ([`design-rationale.md`](./design-rationale.md#agent-orchestration), and the role separation above) - but it is a real cost, paid deliberately. Do not split further without the same justification.

Ledger: C19.

---

## Well-Architected alignment

References: **Well-Architected Agentic AI Lens** and **Financial Services Industry (FSI) Lens**.

| Pillar | Guidance | Where it lands |
|---|---|---|
| **Responsible agentic AI** | Bounded autonomy; transparency and explainability through logs and traces; human oversight tiered by risk and reversibility; goal alignment through evaluation | Bounded retry with a human terminal state, and LLM-as-Judge evaluation ([`design-rationale.md`](./design-rationale.md#retry-and-self-correction)) |
| **Security** | Least privilege for agent actions; guardrails against prompt injection; server-side validation at the point of tool use; version-controlled prompt catalogue; separation of duties | [IAM](#iam-and-least-privilege); [`design-rationale.md`](./design-rationale.md#guardrails-and-sanitization); Langfuse prompt management |
| **Operational excellence** | Human-in-the-loop for critical processes; model versioning and rollback; adversarial testing; agent monitoring dashboards | `needs_human_review` flag; Langfuse prompt versioning; CloudWatch |
| **Observability** | OpenTelemetry to integrate AgentCore Observability with CloudWatch and Langfuse; capture inputs, reasoning steps, outputs and tool usage | [Observability](#observability) |
| **Reliability** | Graceful degradation; failover; fallback to an agent or human handoff that preserves context; fault injection testing | Session reuse carries context into retry ([`design-rationale.md`](./design-rationale.md#retry-and-self-correction)) |

**AGENTPERF05-BP02** - use supervisor-worker when centralized quality control is needed. This is the specific citation behind the star topology.

### Gaps against this guidance

Two items are aspirations rather than implemented positions, and neither has a decision recorded:

- **Adversarial testing** and **fault injection testing** appear in the guidance but in no plan or task.
- **Model versioning and rollback** is only partly covered - Langfuse versions the prompts, but nothing records a pinned model version or a rollback path. Related to G5 in [`superseded-and-rejected.md`](./superseded-and-rejected.md).

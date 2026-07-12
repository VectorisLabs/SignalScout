# Hackathon

> SignalScout

## Your tracks

Built with AWS powered by Amazon Web Services

## Locked problem statements

Built with AWS powered by Amazon Web Services / P1: Build a production-ready AI application using AWS AI/ML

# Project title

SignalScout

# Elevator pitch

SignalScout is an evidence-first early-warning system for corporate restructuring and third-party risk, built as a production-ready multi-agent application on AWS.

Instead of treating layoffs, executive departures, debt amendments, delayed filings, and store closures as isolated news, SignalScout connects them across time into one auditable risk story. A supervisor-worker agent system on Amazon Bedrock AgentCore collects verified public evidence, applies transparent time-decayed scoring, challenges its own conclusions, and produces an actionable report in which every factual claim links back to its source.

Our showcase replays the real Bed Bath & Beyond restructuring using historical SEC filings. It shows when the system would have moved from monitoring to investigation and then to high risk—helping suppliers, procurement teams, lenders, and other counterparties act before Chapter 11 narrowed their options.

# Project details

About the project

````
## Inspiration

Enterprise risk rarely arrives as one clear headline.

A supplier may announce workforce reductions. Weeks later, it may terminate a debt exchange, file a financial report late, amend its credit agreement, or replace senior executives. Each event can have a reasonable explanation on its own. The real information lies in the cluster—and in how that cluster evolves over time.

Today, procurement, supply-chain, sales, and risk teams often monitor counterparties through manual searches, spreadsheets, news alerts, and individual analyst judgment. This process is slow, difficult to audit, and especially weak at connecting small signals spread across different documents and dates.

The 2023 collapse of Bed Bath & Beyond illustrates the problem. Public evidence accumulated over several months:

- In August 2022, the company announced workforce reductions across corporate and supply-chain functions, lower capital expenditure, and store closures.
- In January 2023, a debt exchange was terminated and financial reporting was delayed.
- Credit-agreement defaults and lender waivers followed.
- The company repeatedly amended its financing arrangements through March and April.
- On April 23, 2023, Bed Bath & Beyond filed for Chapter 11.

For a supplier extending unsecured credit, these were not merely financial-market events. They were signals to reconsider payment terms, shipment volumes, insurance coverage, and alternative distribution channels.

We built SignalScout to transform those scattered disclosures into a traceable and actionable early-warning timeline.

## What it does

SignalScout converts verified public documents into structured risk signals and correlates them over time.

The system focuses on one deeply researched case rather than pretending to monitor the entire market at once. The replay uses only evidence that was publicly available at each point in time.

### 1. Structures raw evidence

Each source document is converted into normalized events such as:

- workforce reduction;
- executive departure;
- debt or covenant event;
- delayed filing;
- guidance or capital-expenditure reduction;
- asset or store closure;
- going-concern warning.

Each signal includes:

- company;
- event type;
- event and publication dates;
- confidence;
- source URL;
- exact evidence excerpt;
- immutable evidence identifier.

### 2. Calculates an explainable risk score

A deterministic scoring function weights signals by type, confidence, source quality, and recency.

Only the strongest event of each type contributes fully within a time window, preventing repeated news coverage of the same event from inflating the score. Synergy rules recognize combinations such as a workforce reduction followed by a debt default or delayed filing.

The AI does not invent or override this score.

### 3. Builds a historical replay

The dashboard reconstructs what SignalScout would have known on each historical date. Future documents are excluded from earlier replay states.

As evidence accumulates, the case progresses through:

```text
MONITORING → INVESTIGATING → HIGH RISK → OUTCOME
```

For Bed Bath & Beyond, the replay shows how operational cuts, failed financing actions, covenant problems, and repeated lender amendments gradually formed a much stronger risk pattern.

### 4. Challenges its own conclusion

Before producing the final report, an AI Challenger searches for reasonable benign explanations:

- Was the workforce reduction part of a normal efficiency program?
- Was the financing amendment routine?
- Did the company still have credible alternatives?
- Are several signals simply duplicates of the same disclosure?

The system records the strongest counterargument instead of hiding uncertainty.

### 5. Produces evidence-backed actions

SignalScout generates persona-specific recommendations.

For a supplier, these may include:

- review unsecured receivables;
- reduce credit limits;
- request partial prepayment;
- reduce in-transit inventory;
- qualify alternative sales channels;
- review trade-credit insurance.

Every factual claim in the report references an evidence ID. If the supporting evidence is missing, the claim is rejected rather than displayed.

### 6. Lets judges inspect the evidence live

The historical replay is presented as a pre-recorded video for reliability. After the video, judges can use the live dashboard to inspect the timeline, risk report, Challenger verdict, and recommended actions.

Selecting a citation opens the exact source excerpt supporting that claim. The video is controlled; the evidence is real and independently verifiable.

## How we built it

SignalScout is designed as a production-ready, fully serverless application on AWS. The target architecture is a multi-agent **supervisor-worker** system on **Amazon Bedrock AgentCore**, with deterministic scoring and validation kept outside the model so risk decisions remain reproducible and auditable.

### Request and hosting path

```text
Users → Route 53 → AWS Amplify (Gen 2 hosting) → Amazon API Gateway (HTTP API, Cognito auth)
      → AWS Lambda → Bedrock AgentCore Runtime (Management / supervisor)
```

- **Amazon Route 53** for DNS; **AWS Amplify Gen 2** for CI/CD from Git, CDN, and hosting the React dashboard.
- **Amazon Cognito** for user authentication (user pool + identity pool); **AWS WAF** to protect the frontend and API tier.
- **Amazon API Gateway** exposes an HTTP API (lower cost than REST) plus a separate, signature-verified endpoint for partner webhooks.
- **AWS Lambda** triggers the agent system via `InvokeAgentRuntime`, resolves AppSync queries, and handles webhooks.

### Multi-agent reasoning on Bedrock AgentCore

We use the **AWS Strands Agents SDK** running inside **Bedrock AgentCore Runtime**, following a supervisor-worker topology:

- **Management (supervisor):** orchestrates the flow using a star pattern—it invokes each worker; workers never call each other directly.
- **Crawler (worker):** calls **TinyFish** (AI web agent for IR pages and press releases) and **Apify** (scraping actors for news and SEC filings) as model tools (`tool_use`), then sanitizes and filters raw JSON in plain code before anything reaches the model.
- **Analysis (worker):** performs theme and risk reasoning on the structured, sanitized evidence.

Design decisions that keep this safe and cost-efficient:

- AgentCore Runtime calls external partner APIs directly over HTTPS; we deliberately avoid an AgentCore Gateway/MCP layer that a single-agent, single-tool use case would not justify.
- Untrusted web content is filtered in code (HTML stripping, injection-pattern detection, schema validation, truncation) before model input, which also reduces Bedrock token cost.
- **Amazon Bedrock Guardrails** are attached to the model in the Analysis worker—the point where untrusted content enters reasoning and prompt-injection risk is highest.
- Cross-agent handoffs use the A2A protocol (`InvokeAgentRuntime`), so control flow is traceable and workers are independently scalable and reusable.

### Deterministic scoring and validation

Risk decisions never depend on the model alone. A deterministic engine applies event-type weights, confidence and source-quality adjustments, temporal decay, per-type deduplication, cluster synergy rules, and investigation/high-risk thresholds. A validator then checks that the output matches the schema, every claim resolves to a real evidence ID, and replay evidence was published on or before the selected `as-of` date. Invalid reports fail closed.

### Self-correction loop (Reflexion)

- Every agent run exports traces and an **LLM-as-Judge** score to **Langfuse**.
- On a high score, a Langfuse webhook triggers a Lambda that writes the validated result to storage for display.
- On a low score, a Langfuse alert webhook hits the dedicated API Gateway endpoint; a Webhook-Handler Lambda reads an atomic `retry_count` from DynamoDB and, below the retry limit, re-invokes Management with a verbal `critique` on the same session so the agent corrects itself instead of repeating the mistake. Beyond the limit, the case is flagged for human review.

### Storage and data access

- **Amazon DynamoDB** (On-Demand) holds metadata in two tables: `MarketThemes` (display data exposed through AppSync) and `PipelineState` (operational data such as `retry_count`, `session_id`, and `critique`, never exposed to the client).
- **Amazon S3** (Intelligent-Tiering) stores raw evidence and results, written per attempt without overwriting, to support replay, debugging, evaluation datasets, and compliance.
- The dashboard reads through **AWS AppSync** (Amplify Data / GraphQL) → Lambda resolver → DynamoDB → S3 **presigned URL**, so the browser downloads content directly from private S3 without ever having public access.

### Security, observability, and cost

- **IAM** enforces least privilege with a separate execution role per runtime and specific resource ARNs (no wildcards), limiting blast radius given LLM-generated actions.
- **AWS Secrets Manager** stores partner API keys and the webhook signing secret; the webhook endpoint verifies an HMAC signature and timestamp instead of Cognito.
- **Amazon CloudWatch** captures logs, metrics, and alarms; **AWS CloudTrail** provides an account-wide audit trail—both important for a wealth-management/compliance context.
- The system is 100% serverless (Lambda, DynamoDB On-Demand, AgentCore consumption-based) with no cost while idle; AgentCore is not billed during I/O wait for LLM or partner calls.

### External services

- **TinyFish** — AI web agent for reading investor-relations pages and press releases.
- **Apify** — web-scraping actors for news sites and SEC filings.
- **Langfuse** — LLM observability, tracing, LLM-as-Judge scoring, prompt management, and the webhook that drives the self-correction loop.

### Demo reliability

To keep the presentation dependable, AI analysis is run before the demo and its validated result is stored. Judges see a recorded historical replay followed by a live, interactive evidence dashboard. This preserves the substance of the system—real, verifiable evidence and traceable citations—without depending on a perfect network connection during judging.

## Challenges we ran into

### Preventing hindsight leakage

Historical backtests can appear impressive while accidentally using information published after the date being replayed.

We addressed this by separating `event_date`, `published_at`, and `retrieved_at`, and by requiring every replay query to enforce `published_at <= as_of_date`.

### Preventing hallucinated citations

Prompting a model to “include citations” is not a sufficient guardrail. A citation may exist but fail to support the sentence attached to it.

We structured reports as claims linked to evidence IDs and added deterministic checks for citation existence and source resolution. Unsupported claims are removed rather than rewritten as facts.

### Avoiding duplicated evidence

A single corporate announcement may be repeated by dozens of news outlets. Counting every article would produce an artificially high risk score.

SignalScout deduplicates events and prevents multiple reports of the same underlying disclosure from being treated as independent confirmation.

### Keeping deterministic control over an agentic system

Multi-agent systems are powerful but can drift, loop, or silently change conclusions. We kept scoring, thresholds, and validation in deterministic code outside the model, bounded the self-correction loop with an atomic retry counter and human-review fallback, and required every retry to carry a critique so the agents improve rather than repeat errors.

### Keeping the demo reliable

A live crawler and multi-agent workflow would introduce unpredictable latency and network failures during judging without improving the central product demonstration.

We therefore run AI analysis before the presentation, store the validated result, and use a recorded historical replay followed by a live evidence inspection. This preserves the substance of the system without depending on a perfect network connection.

### Balancing warning and prediction

SignalScout does not claim to predict the exact date of a bankruptcy. Its purpose is to recognize when a cluster becomes important enough for a human to investigate or reduce exposure.

The dashboard therefore distinguishes an early investigation marker from a later high-risk alert and from the final known outcome.

## Built with

- Amazon Bedrock AgentCore (Runtime, Memory, Identity)
- Amazon Bedrock (foundation model + Guardrails)
- AWS Strands Agents SDK
- AWS Lambda
- Amazon API Gateway (HTTP API)
- AWS AppSync
- AWS Amplify (Gen 2 hosting)
- Amazon Cognito
- AWS WAF
- Amazon Route 53
- Amazon DynamoDB
- Amazon S3 (Intelligent-Tiering)
- AWS Secrets Manager
- Amazon CloudWatch
- AWS CloudTrail
- AWS IAM
- React
- TinyFish
- Apify
- Langfuse
````



## Built with
Select the tools, frameworks, platforms, cloud services, databases, APIs, or models you used. Press Enter to add a custom tool.
- AWS
- Amazon Bedrock AgentCore
- Amazon Bedrock
- AWS Strands Agents SDK
- AWS Lambda
- Amazon API Gateway
- AWS AppSync
- AWS Amplify
- Amazon Cognito
- Amazon DynamoDB
- Amazon S3
- React
- TinyFish
- Apify
- Langfuse
- OpenAI

## Links and media
### Demo URL
https://example.com

### GitHub / repository URL
https://github.com/VectorisLabs/SignalScout

### Video demo link
https://youtu.be/c9ZgQTMOngM


## Which AABW technology partner tools, platforms, or services did your team use in your project?
Select at least one AABW technology partner tool, platform, or service your team used. Some partners may reward teams based on the stacks used, so be clear, specific, and honest.
Apify x
AWS x
ClickHouse x
Langfuse x
OpenAl x
tinyfish x

## Briefly explain how you used each technology partner's tools, platform or services.
Explain how you used the partner technologies you selected above.

````
### AWS

AWS is the foundation of SignalScout's production architecture. The multi-agent system runs on Amazon Bedrock AgentCore Runtime using the AWS Strands Agents SDK in a supervisor-worker topology (Management, Crawler, Analysis), with an Amazon Bedrock foundation model and Bedrock Guardrails applied at the reasoning worker.

Around the agents we use a fully serverless AWS stack: AWS Lambda for orchestration, resolvers, and webhook handling; Amazon API Gateway (HTTP API) for the user-facing and webhook endpoints; AWS AppSync for the dashboard's GraphQL data layer; AWS Amplify (Gen 2) for hosting the React dashboard; Amazon Cognito for authentication; Amazon DynamoDB for metadata and pipeline state; Amazon S3 (Intelligent-Tiering) for evidence and results; AWS Secrets Manager for credentials; and CloudWatch, CloudTrail, and IAM (least-privilege, one role per runtime) for observability, audit, and security.

### OpenAI API

We used the OpenAI API in our working prototype's reasoning pipeline to convert verified evidence into structured risk signals and to generate the Correlator, Challenger, and Assessor outputs. In the production design this reasoning layer maps onto Amazon Bedrock; the prompts, structured-output schemas, and validation logic are model-agnostic.

The Challenger was specifically instructed to find benign explanations and weaknesses in the emerging hypothesis. Model outputs were never accepted as standalone facts: every final claim had to reference a verified evidence ID and pass deterministic validation.

### tinyfish

We used TinyFish as an AI web-agent evidence collector, invoked as a model tool, to read investor-relations pages and press releases for the case company.

TinyFish results are treated as untrusted candidates: they are sanitized and filtered in code, normalized into our fixed signal schema, and only accepted after deterministic validation. No TinyFish output becomes a final factual claim without a resolvable evidence ID.

### Apify

We used Apify scraping actors as an evidence collector for news sources and SEC filing pages, also invoked as a model tool for known URLs and batch collection.

As with TinyFish, Apify dataset items are untrusted candidates: sanitized, deduplicated so repeated coverage of one disclosure is not counted as independent confirmation, and validated against the signal schema before use.

### Langfuse

We used Langfuse to trace the evidence-extraction, correlation, challenge, and assessment steps, and to inspect model inputs and outputs, latency, token usage, and prompt versions.

Langfuse also drives our self-correction loop: an LLM-as-Judge score is attached to each run, and a webhook notifies the pipeline so low-scoring results can be re-run with a critique (bounded by a retry limit) or flagged for human review. We use a fixed historical dataset and deterministic evaluation checks for structured-output validity, citation coverage, and evidence resolution.

### ClickHouse

> Reviewer note — confirm before submitting: the production architecture stores signals, scores, and replay state in Amazon DynamoDB + S3, not ClickHouse. Only keep this entry (and the ClickHouse selection) if ClickHouse was genuinely used in an earlier analytical/backtest prototype; otherwise remove it to stay honest. Draft below assumes prototype use.

We evaluated ClickHouse Cloud in an early analytical prototype to store normalized signals, source metadata, and historical risk scores, and to reconstruct the case for any historical date while excluding future evidence. In the current production design this role is served by Amazon DynamoDB (metadata and pipeline state) and Amazon S3 (per-attempt evidence and results).
````
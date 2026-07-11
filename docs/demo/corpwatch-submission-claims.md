# CorpWatch submission claims ledger

| Capability or partner | Status | Proof / wording |
|---|---|---|
| Frozen Bed Bath & Beyond evidence replay | DEMONSTRATED | Dashboard loads `frontend/public/demo/case-package.json`; demo runbook. |
| Metric extraction and normalization | TESTED | `tests/metrics/extract-metric-observations.test.ts`. |
| Temporal, provenance and bundle safety | TESTED | Builder and validator suites. |
| Offline Executive Dashboard | DEMONSTRATED | Vite build and UI suite; no provider key required. |
| OpenAI chat orchestration | LIVE_RECEIPT | Live Responses API turns completed with neutral tool routing, final answers and Langfuse traces; latest production-prompt smoke trace: `f246668e5422f04c11d97d6f63f2a24c`. |
| Collector Router | TESTED | Routing and Evidence Gate suites cover TinyFish/Apify selection, SSRF and temporal rules. |
| Agent Operations dashboard | TESTED | UI tests cover chat controls, metrics, route chart and run log states. |
| TinyFish | LIVE_RECEIPT | Live Fetch returned one bounded candidate with zero per-URL errors; live Search success and fail→retry behavior were also exercised. Successful validation trace: `77e0ece6ec6366d820aae7762c6667c1`. |
| Apify | TESTED | Validate-only actor/cost/timeout schema only. No live receipt; omit partner-use claim. |
| Langfuse | LIVE_RECEIPT | Live traces, observations and scores were written and queried back through the Public API. `corpwatch/chat-agent` production prompt version 1 is active. |
| OpenAI | LIVE_RECEIPT | Primary runtime completed live no-tool and TinyFish tool-loop turns; model output, usage and prompt version are linked to sanitized Langfuse traces. |
| AWS / ClickHouse | OMIT | Mentioned in an older architecture plan but not used by this frozen MVP. |

Truth-safe wording: “CorpWatch uses OpenAI Responses API for its investigation chat, TinyFish Search/Fetch for bounded public-web collection, and Langfuse for prompt management, traces and deterministic evaluation scores. Live crawl output remains unverified discovery context unless it passes rights review and human curator approval. The judged replay remains available offline from a frozen, cited evidence bundle.”

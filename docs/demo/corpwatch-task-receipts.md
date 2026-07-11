# CorpWatch task receipts

## Baseline and contracts

- TASK: CW-000 / CW-100
- STATUS: DONE
- FILES: `package.json`, `.gitignore`, `backend/src/contracts/*`
- TESTS: `npm test` — backend 33 tests and frontend 5 tests passed; `npm run typecheck` passed; `npm run build` passed
- RISKS: The repository started with documentation only; the historical “145 tests” state in the guide did not exist in this checkout.
- HANDOFF: Canonical `CasePackage`, evidence/source, metric observation and readiness schemas.

## Evidence and deterministic pipeline

- TASK: CW-110–CW-320
- STATUS: DONE
- FILES: `backend/tests/fixtures/metric-text.ts`, `backend/src/metrics/extract-metric-observations.ts`, `backend/src/report/build-metric-lens.ts`, `backend/scripts/build-case.ts`, `frontend/public/demo/case-package.json`
- TESTS: focused extractor, metric-lens and builder suites included in 22/22 passing tests
- RISKS: Public evidence set is intentionally small and retrospective.
- HANDOFF: Stable canonical frozen bundle.

## Validation and dashboard

- TASK: CW-400–CW-540
- STATUS: AUTOMATED GATE DONE; BROWSER/HUMAN REVIEW PENDING
- FILES: `backend/scripts/validate-public-bundle.ts`, backend validator tests, `frontend/src/app/*`
- TESTS: validator negative matrix and App component tests included in 22/22 passing tests
- RISKS: Browser backend was unavailable in the Codex session on 2026-07-12. Manual two-person accessibility review and two timed video rehearsals remain human submission actions.
- HANDOFF: Fail-closed offline judged experience.

## Partner and submission truth

- TASK: CW-600–CW-740
- STATUS: LIVE OPENAI/TINYFISH/LANGFUSE PROOF CAPTURED; APIFY LIVE PROOF OMITTED
- FILES: `backend/src/partners/safety.ts`, `backend/scripts/preflight-partners.ts`, `docs/demo/*`, proposal
- TESTS: partner bounds/sanitization and validate-only preflight
- RISKS: Apify has no actor ID/live run receipt and must remain `TESTED`, not `LIVE_RECEIPT`.
- HANDOFF: Truth-safe demo and proposal wording.

## OpenAI chat agent, collector routing and observability

- TASK: CW2-100–CW2-500
- STATUS: AUTOMATED GATE AND LIVE RECEIPTS DONE; HUMAN CURATION PENDING
- FILES: `backend/src/agent/*`, `backend/src/server.ts`, `frontend/src/app/*`, `docs/corpwatch-openai-chat-implementation-plan.md`, routing policy
- TESTS: backend 33/33 and frontend 5/5 passing tests, including OpenAI no-tool/tool-loop/clean-output/retry regression coverage; backend health/metrics smoke test passed
- RISKS: Live crawl records are deliberately unverified discovery context. Every collector candidate has `RIGHTS_UNKNOWN`; approved live citations require a future rights-review/curator workflow.
- HANDOFF: Keep the judged replay on the frozen approved bundle. Present live crawl as bounded discovery plus validation, never as approved evidence.

## Live partner receipts — 2026-07-12

- OpenAI + TinyFish Fetch + Langfuse validation: trace `77e0ece6ec6366d820aae7762c6667c1`; one clean JSON record; `crawl_output_schema_valid=1`; `crawl_clean_record_ratio=1`.
- Langfuse fail/retry path: trace `e75b0002d7cf8b69dabab7d4ffa62fe5`; attempt 1 and attempt 2 scored `crawl_output_schema_valid=0`; loop stopped at budget with a final answer.
- Langfuse managed prompt: `corpwatch/chat-agent`, production version 1; smoke trace `f246668e5422f04c11d97d6f63f2a24c` reported `promptSource=production` and `promptVersion=1`.
- Receipts contain IDs, counts and pass/fail state only; no API key, Authorization header or raw remote page is stored here.

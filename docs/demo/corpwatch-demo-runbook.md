# CorpWatch — 3-minute demo runbook

## Setup

Run `npm run build && npm run preview` from the repository root. The judged replay uses the validated `frontend/public/demo/case-package.json` and remains available when partner services are unavailable. If live chat is shown, verify `/api/health` reports OpenAI, TinyFish and Langfuse configured before recording.

Live crawl is discovery context, not approved evidence. Never describe a fresh crawl candidate as a verified citation: the current Evidence Gate requires rights review and human curator approval, which are outside the frozen MVP path.

## Script

| Time | Screen and narration |
|---|---|
| 0:00–0:20 | “Corporate-change evidence arrives as isolated filings, operating changes and news. Single events are noise; clusters are stories.” Show the hero and offline label. |
| 0:20–0:40 | Introduce the frozen Bed Bath & Beyond case and explain that Northstar Home Retail is fictional. Select the earliest as-of frame. |
| 0:40–1:15 | Move through replay frames. Point out that the known outcome remains hidden until its public date and open one approved SEC citation. |
| 1:15–1:45 | Show the metric lens, normalized units, reporting period, provenance, and how missing required metrics would block a section. |
| 1:45–2:20 | Compare MAINTAIN, ADAPT and ACCELERATE across cost, benefit, risk and operational impact. |
| 2:20–2:40 | Show the bounded ADAPT recommendation and challenger questions; call these review postures, not autonomous decisions. |
| 2:40–2:55 | Explain that schema, references, temporal visibility, readiness and secret leakage are validated locally before the app builds. |
| 2:55–3:00 | “Single events are noise. Clusters are stories.” |

## Rehearsal checklist

- Complete two consecutive runs under three minutes.
- Verify keyboard focus, 360 px and desktop layouts.
- Record reviewer names, timestamps and measured run durations in `corpwatch-task-receipts.md` before applying a final MVP tag.
- Never show `.env.local`, raw provider responses or terminal history containing secrets.
- If the internet is unavailable, continue unchanged; external links need not open during the judged path.

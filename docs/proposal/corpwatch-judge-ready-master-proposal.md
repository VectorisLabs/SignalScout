# CorpWatch Strategic Change Radar

CorpWatch turns scattered public corporate-change signals into a cited, replayable strategic decision brief. It reconstructs what was knowable at each historical date, measures which financial and operating dimensions are supported, compares MAINTAIN / ADAPT / ACCELERATE responses, and shows executives which evidence supports—or blocks—each review posture.

The primary interaction is now an OpenAI-powered investigation chat. OpenAI can request one provider-neutral evidence collection function; deterministic backend policy selects TinyFish or Apify, validates candidates through the Evidence Gate, records traces/scores in Langfuse when configured, and exposes route, validation, latency and token metrics in the dashboard.

## What the MVP demonstrated

- A deterministic, rights-safe Bed Bath & Beyond retrospective with source and evidence provenance.
- A temporal replay that excludes evidence until its public availability timestamp.
- Deterministic metric extraction, including billion-to-million normalization and honest missing-data readiness gates.
- A fail-closed public-bundle validator for schema, provenance, temporal leakage, false readiness and credential-like content.
- A responsive, keyboard-operable offline Executive Dashboard with scenarios, impact framing, recommendation, challenger questions and limitations; final accessibility audit remains a human freeze step.

Northstar Home Retail is explicitly fictional and used only as strategic comparison context. CorpWatch is not a bankruptcy predictor, its story index is not a calibrated probability, and its scenarios are decision support rather than autonomous recommendations or certified forecasts.

## Technology truth

The build uses TypeScript, React, Vite, Vitest and Zod. OpenAI Responses API powers the live investigation chat; TinyFish Search/Fetch supplies bounded public-web discovery candidates; Langfuse stores the production core-agent prompt, traces and deterministic crawl-output scores. These three integrations have sanitized live receipts. Apify remains a validate-only adapter and is not claimed as materially used. The frozen replay fallback requires no network service or provider key.

Fresh live crawl output is explicitly unverified discovery context. It is cleaned to `{title, date, content, url}` and evaluated before reaching the core agent, but it cannot become an approved citation until rights eligibility and human curator approval are recorded.

## Reliability promise

`CasePackage` is the only canonical UI state. A deterministic build creates the public JSON, validation fails closed, and the dashboard reads only that frozen artifact. Provider responses, raw pages, telemetry and receipts can never become UI state directly.

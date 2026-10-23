---
baseline_schema: "2.0"
pack: "frontdoor"
document: "hallucination"
status: "active"
updated: "2026-10-23"
code_ref: "uncommitted"
---

# Frontdoor - Decisions and Open Questions

## Entry index

| ID | Subject | Status | Related |
|---|---|---|---|
| FD-D1 | Brand logo choice | closed | FD-D2 |
| FD-D2 | Visual signature | closed | FD-D1 |
| FD-D3 | Production architecture wording | closed | - |
| FD-D4 | Source of figures in images | closed | - |
| FD-D5 | Icon theming in README | closed | FD-D6 |
| FD-D6 | No tables in README.md | closed | FD-D5, FD-D7 |
| FD-D7 | README split into marketing and tech files | closed | FD-D6 |
| FD-D8 | Marketing tone | closed | FD-D4 |
| FD-D9 | Dark-theme highlight colours pinned | closed | FD-D2 |
| FD-D10 | Content-fit icon set in docs/assets/icon | closed | FD-D5, FD-D6 |
| FD-D11 | README.md section order and Quickstart placement | closed | FD-D7 |
| FD-D12 | Hero banner: centred brand on radar | closed | FD-D1, FD-D2, FD-Q2 |
| FD-D13 | README.tech.md mobile layout | closed | FD-D6, FD-D7 |
| FD-Q1 | Final brand file set and favicon form | open | FD-D1 |

## Closed decisions

### FD-D1: Brand logo choice

- Decision: the logo is R8D - the round-4 4F owl centred above the round-3 R3-8 lowercase Bricolage Grotesque 800 wordmark `signalscout`, whose o is a lens (ring, lime pupil, one highlight).
- Why: the user chose the 4F owl and the R3-8 wordmark in round 8, then approved the centred-badge combination.
- Breaks if ignored: README hero, nav buttons and CTA banner stop matching the brand.
- Rejected: rounds 1-2 marks as a logo - read as an app icon library, not a marketing brand (they are reused as table icons instead); round-4 first version - removed by the user as bringing no value; meerkat and owl in round 5 - excluded by the user; 8A one-line row and 8B two-line stack - not chosen; 8C lens-eyed owl - eyes lose their dark pupil and look blank; 8F owl replacing the o - weak at small sizes.

### FD-D2: Visual signature

- Decision: shapes are a geometric flat owl and evidence dots on a timeline; type Bricolage Grotesque 800 headings, Manrope body; palette forest #146044, deep #123F36, lime #C9F269, paper #F3F5F1, detail #0B2A22; ground paper / #0f1f1a; lime is the one bright signal.
- Why: continues the approved logo across every README image.
- Breaks if ignored: images look like a different project.

### FD-D3: Production architecture wording

- Decision: keep the original README's presentation of the AgentCore production architecture; do not label it as unbuilt.
- Why: the user stated production is being built and the README should stay as it is (answer K1: b).
- Breaks if ignored: README contradicts the user's positioning.
- Rejected: stating that `signalscout-prod/agents/` and `signalscout-prod/lambdas/` hold only `.gitkeep` - user declined.

### FD-D4: Source of figures in images

- Decision: the stats strip uses only figures already in the README: 3+ months lead time, 0 model-computed scores, 2 model families, $0 when idle.
- Why: answer M1: a; a figure with no source in the repository is an unbacked claim.
- Breaks if ignored: marketing images assert numbers nobody can trace.
- Rejected: new figures supplied by the user - not chosen.

### FD-D5: Icon theming in README

- Decision: each icon is a light and a dark SVG pair switched by `<picture>` with `prefers-color-scheme`.
- Why: answer M2: b; GitHub does not recolour images per theme.
- Rejected: one forest tile with a lime glyph for both themes - lighter markup, not chosen.

### FD-D6: No tables in README.md

- Decision: every list in `README.md` is an `<h4>` with the icon left of the title, then a `<p>` description.
- Why: the user reported tables render badly on a phone.
- Breaks if ignored: the marketing page breaks on mobile.
- Rejected: icon column in a markdown table - the previous layout, replaced for mobile.

### FD-D7: README split into marketing and tech files

- Decision: `README.md` is the marketing page; scoring, Evidence Gate, trust boundaries, Reflexion, data flow, v2 table, decisions, cost, IaC tiers, invariants, documentation map and Built With live in `README.tech.md`, reached by the `tech-cta` banner and the Tech deep-dive nav button. The AWS architecture (v1 diagram, four agents, alert rule, v2 diagram) appears in both files, placed in `README.md` directly after the marketing pitch.
- Why: the user found the README a wall of text and stated the architecture plays an important role.
- Breaks if ignored: engineers lose detail, or the front page fills with reference material again.
- Rejected: `<details>` blocks inside `README.md` - tried in the previous pass, the page still read as a wall of text.

### FD-D8: Marketing tone

- Decision: bold landing-page tone, short lines and strong verbs (answer M3: b), with the non-claims section kept in `README.md`.
- Why: the user asked for a marketing tone; the non-claims keep it honest.
- Rejected: restrained executive tone - not chosen.

### FD-D9: Dark-theme highlight colours pinned

- Decision: highlighted cards (stats first card, before-after right card, tech CTA, round-8 8H hero) use literal #146044 / #123F36 instead of the theme token.
- Why: the forest token turns mint in dark mode, and lime text on mint was unreadable - seen in `stats-dark.webp` and the 8H dark render.
- Breaks if ignored: the brightest card in each image becomes the least legible in dark mode.

### FD-D10: Content-fit icon set in docs/assets/icon

- Decision: every README icon is drawn for the topic it sits beside (31 marks, for example `shield-check` for the Evidence Gate, `hub` for the supervisor, `bag` for Bed Bath & Beyond), generated by `docs/assets/icon/source/icons.py` into `docs/assets/icon/` as light and `-dark` SVG; nav and engineering-contents pills are borderless full pills cut by `docs/assets/readme/source/pill.py`.
- Why: the user found the round-1/2 marks over-used and not matched to their content, and asked for a dedicated icon folder and pills without the framing rectangle.
- Breaks if ignored: one abstract mark stands for unrelated topics and the icons stop carrying meaning.
- Rejected: reusing round-1/2 logo marks as icons - over-used, depended on the uncommitted `.frontdoor/` folder; icons under `docs/assets/readme/icons/` - user asked for `docs/assets/icon/`.

### FD-D11: README.md section order and Quickstart placement

- Decision: order is hero, nav pills, award, pitch (text between each image), trust items, non-claims, architecture (v1 with four agents, then v2 with a short paragraph and four bullets), How It Works (landscape pipeline, five icon steps, three floating posture cards), backtests, Engineering (heading, CTA banner, contents pills); Quickstart lives only in `README.tech.md`.
- Why: the user asked for the non-claims to be told early, v2 to carry some but less weight than v1, and Quickstart to move to the tech file.
- Breaks if ignored: the honesty limits appear after the reader has formed an impression, and the marketing page fills with commands again.
- Rejected: non-claims at the end of the page - read too late; portrait five-card pipeline - unreadable at phone width; posture cards inside one framed rectangle - user asked for floating boxes.

### FD-D12: Hero banner: centred brand on radar

- Decision: `hero` is the round-3 G direction - owl 140 px, wordmark 132 px, subtitle 50 px, tagline 25 px centred on a 1200x600 item at the centre of five radar rings; a sweep wedge from the centre to the top right holds five lit, joined evidence dots among faint dots. Sketches stay in `docs/assets/readme/.frontdoor/` (ignored by git).
- Why: the user asked for a centred brand with the illustration around it, larger logo and wordmark for phone reading, more dots in the sweep and a bigger radar field.
- Breaks if ignored: at phone width the 96 px wordmark of the old hero shrank to an unreadable size, and the old hero carried an empty band under its dot strip.
- Closes FD-Q2.
- Rejected: round-1 A radar, B evidence timeline, C lens on a deep band - brand block not centred; round-2 E converging streams and F clusters in the noise - not chosen; sweep starting outside the text block (r 330) - the user rejected the wedge cut off in the middle.

### FD-D13: README.tech.md mobile layout

- Decision: `README.tech.md` follows the `README.md` layout - `hero` banner, the eleven `eng-*` pills as an in-file contents row, back link; short lists (agents, data flow, v2, Quickstart paths, Evidence Gate checks, trust boundaries, IaC tiers, Built With) are icon `<h4>` + `<p>` from `docs/assets/icon/`; long uniform lists (taxonomy, synergy, guardrails, 12 decisions, cost levers, documentation map) are bullets or numbered lists under at most one icon heading; zero tables. Headings keep their text so the `README.md` pill anchors still resolve.
- Why: the user asked for the same design topology in the tech file.
- Breaks if ignored: the tech file breaks on a phone, and renamed headings break the `README.tech.md#...` links from `README.md`.
- Rejected: one icon per item in 7-12 item lists - the same icon repeated reads as noise; keeping tables in the tech file as desktop reference - superseded by this request.

## Open questions

### FD-Q1: Final brand file set and favicon form

- Open: produce clean SVG master, reversed and mono versions of R8D, a favicon and a short brand guide (clear space, minimum size, colours)?
- Context: the round-8 size ladder (8G) showed owl belly detail disappears at 16 px; the earlier recommendation was the lens o alone at 16-32 px and the owl head from 64 px.
- Default if unanswered: lens o for 16-32 px, owl head from 64 px.

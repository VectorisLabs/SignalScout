---
baseline_schema: "2.0"
pack: "frontdoor"
document: "introduction"
status: "active"
updated: "2026-10-23"
code_ref: "uncommitted"
---

# Frontdoor - Brand Logo and README Presentation

## Scope

The public face of the SignalScout repository: the brand logo, the README illustrations, and the split of the README into a marketing page (`README.md`) and an engineering reference (`README.tech.md`). Product code, Terraform and the production packs under `docs/baseline/signalscout-prod.index.md` are out of scope.

## Current truth

| Item | State | Evidence |
|---|---|---|
| Brand logo | decided: R8D centred badge (FD-D1) | `.frontdoor/round-8/logos.html` item `r8d-center` |
| Visual signature | implemented | header comment of `docs/assets/readme/source/readme.html` |
| README illustrations | implemented, 9 images and 17 pills, light + dark | `docs/assets/readme/*.webp` |
| Content icons | implemented, 31 marks, light + dark SVG (FD-D10) | `docs/assets/icon/` |
| `README.md` marketing page | implemented, no tables | working tree, uncommitted |
| `README.tech.md` engineering reference | implemented, no tables | working tree, uncommitted |
| Rendering on GitHub (light, dark, phone) | unverified | not observed |
| Final logo files (clean SVG, favicon, brand guide) | planned | none |

- The design board is `.frontdoor/directions.html`; `.frontdoor/` is gitignored and holds rounds 1-8 of logo exploration.
- Images are rendered from HTML by the `frontdoor-illustrate` skill's `render.py`; see `frontdoor.sourcecode.md`.

## Target

- `README.md` reads in 30 seconds as a marketing page that works on a phone; `README.tech.md` carries every technical detail removed from it.
- The R8D logo exists as production brand files (SVG master, reversed, mono, favicon) with a short usage guide.

## Constraints

- Every fact in an image or README sentence traces to the repository or to the pre-rewrite README; no invented figures (FD-D4).
- The production architecture is presented as in the original README, not relabelled as unbuilt (FD-D3).
- The AWS architecture diagrams appear in both README files (FD-D7).
- Text in an image is repeated in alt text or adjacent README text.
- ASCII hyphen only; no en or em dash in either README.
- Nothing is committed without the user's explicit request.

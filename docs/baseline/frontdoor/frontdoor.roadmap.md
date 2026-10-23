---
baseline_schema: "2.0"
pack: "frontdoor"
document: "roadmap"
status: "active"
updated: "2026-10-23"
code_ref: "uncommitted"
---

# Frontdoor - Roadmap

| Phase | Goal | Depends on | Status |
|---|---|---|---|
| Phase 1 | Logo exploration and choice | - | complete |
| Phase 2 | README illustrations | Phase 1 | complete |
| Phase 3 | README restructure and tech split | Phase 2 | complete |
| Phase 4 | Visual verification on GitHub | Phase 3 | next |
| Phase 5 | Final brand files | Phase 1, FD-Q1 | planned |
| Phase 6 | Commit | Phase 4 | planned |

## Phase 1: Logo exploration and choice

- Status: complete.
- Evidence: rounds 1-8 on `.frontdoor/directions.html`; choice recorded in FD-D1.

## Phase 2: README illustrations

- Status: complete.
- Evidence: `render.py` produced `hero`, `stats`, `problem`, `before-after`, `pipeline`, `postures`, six `nav-*` and `tech-cta`, light and dark, all under 70 KB, no WARN, fonts Bricolage Grotesque and Manrope loaded. `icons.py` wrote 26 SVG files. Light and dark previews were opened for the hero, problem, pipeline, postures, stats, before-after, nav-tech, tech-cta and the icon sheet.
- Gap: the five nav pills other than `nav-tech` and `tech-cta-dark` were not opened.

## Phase 3: README restructure and tech split

- Status: complete, uncommitted.
- Evidence: script check found every image, icon and doc path in both files present, every `#anchor` matched to a heading, zero table rows in `README.md`, no en or em dash. Word counts: `README.md` 1372, `README.tech.md` 2342 (markup included).
- Decisions: FD-D3, FD-D6, FD-D7, FD-D8, FD-D10, FD-D11, FD-D12, FD-D13.
- Pass 4 evidence: `icons.py` wrote 31 icons (contact sheet viewed light and dark); render produced every item with no WARN after the pipeline height fix; pipeline, `posture-accelerate-dark`, `nav-engineering-dark` and `eng-trust` viewed; script check found every image and icon path present, zero table rows and no en or em dash in `README.md` (1538 words, markup included). Other pills and posture cards not opened.
- Pass 5 evidence: `README.tech.md` rebuilt with zero table rows, every image and icon path present, no en or em dash, 358 lines. Hero re-rendered from round 3 G (FD-D12): `hero.webp` and `hero-dark.webp` 2400x1200, about 100 KB each, no WARN, both viewed; hero alt text updated in both READMEs.

## Phase 4: Visual verification on GitHub

- Acceptance: on github.com, light and dark, desktop and phone width: nav pills sit on one line on desktop, pills show no frame, `align="absmiddle"` keeps icons on the title line, `<picture>` switches inside headings, the tech CTA link opens `README.tech.md`, anchors jump.
- Gate: requires a push or a preview the user controls; not observable from this machine.
- Next action: open the README on GitHub after the user pushes, check the acceptance list in both themes and at phone width, including the radar hero from FD-D12 (which closed FD-Q2, hero bottom whitespace).

## Phase 5: Final brand files

- Acceptance: SVG master, reversed and mono R8D; favicon set per FD-Q1; one brand guide page.
- Blocked on: FD-Q1 (final brand file set and favicon form).

## Phase 6: Commit

- Acceptance: user asks for a commit; staged diff scanned for secrets; no AI attribution trailer.
- State: the working tree was observed staged (including `.gitignore`) at HEAD 3d706e9, not committed.
- Scope: `README.md`, `README.tech.md`, `docs/assets/readme/`, `docs/assets/icon/`, `docs/baseline/frontdoor/`. `.frontdoor/` stays uncommitted. The pending `.gitignore` change predates this work and must be confirmed with the user before staging.

## Risks

| Risk | Effect | Mitigation |
|---|---|---|
| GitHub strips or mis-aligns HTML in headings | icons drop below titles on mobile | Phase 4 check; fall back to plain `**title**` lines |
| Fonts load from Google Fonts at render time | re-render offline falls back to system fonts | render online; `render.py` warns on fallback |
| Image text not searchable | facts lost for screen readers | alt text repeats every figure |

# signalScout - Figma Redesign Prompt (Tailwind CSS)

> **Scope: UI, POC dashboard.**

> Paste the block below into your AI design/design-to-code tool (Figma Make / First Draft, v0, Lovable, Builder.io, etc.).
> It is written to reproduce and elevate the **current** signalScout UI, output in **Tailwind CSS**.

---

You are a senior product designer + front-end engineer. Redesign the marketing-grade dashboard for a B2B product called **signalScout** and deliver it as a responsive web page using **Tailwind CSS** (utility-first, no custom CSS unless unavoidable; extend the theme via `tailwind.config`). Match the structure below exactly, but make it visually premium, editorial, and confident - think "the Bloomberg terminal, reimagined by a Scandinavian design studio."

## Product
signalScout is an **evidence-led strategic change radar**. It investigates public corporate-change signals and returns cited, replayable evidence with three decision postures: `MAINTAIN`, `ADAPT`, `ACCELERATE`. Tone: authoritative, calm, factual - never hype. Every claim links to evidence. The hero product moment is an **inline AI evidence-agent chat** sitting directly inside the overview.

## Brand & Design System (extend Tailwind theme)
- **Palette (light theme, primary):**
  - Background canvas: `#F3F5F1` (warm off-white)
  - Ink / primary text: `#17211D`
  - Muted text: `#69736E`; hairline borders: `#DCE2DC`; soft fill: `#EDF1EC`
  - Deep forest (brand surface): `#123F36`; secondary green: `#176455`
  - **Lime accent (signature): `#C9F269`** - used sparingly for CTAs, active states, the posture card
  - Amber highlight: `#EF9E58`; danger: `#A44336`; success text on chips: `#146044` on `#DAF0E5`
  - Paper: `#FFFFFF`
- **Dark theme:** provide a full dark variant (`dark:` classes). Invert canvas to `#0B1512`, surfaces to `#0F211C`/`#12352E`, keep lime accent, ensure 4.5:1 text contrast.
- **Typography:** headings in **Manrope** (700/800, very tight tracking ~ `-0.05em`, line-height ~0.95 on the giant hero); body/UI in **Inter** (or system sans). Hero company name is huge - `clamp(3.6rem, 7vw, 6.7rem)`. Section titles `clamp(2rem, 4vw, 3.3rem)`. Eyebrows: 0.72rem, 800 weight, uppercase, letter-spacing `0.16em`.
- **Radius:** cards `rounded-3xl` (24px) for hero, `rounded-2xl` for panels, `rounded-xl` for chips/buttons, pills `rounded-full`.
- **Elevation:** one soft brand shadow `0 18px 55px rgba(20,48,40,0.09)`; panels use a lighter `0 8px 30px rgba(23,33,29,0.045)`.
- **Effects:** subtle radial glow of lime at 18% opacity in the top-right of the dark hero; glassmorphism (`backdrop-blur`, `bg-white/7`, `border-white/15`) for the inline chat panel and the sticky nav.

## Iconography & imagery (quality bar - do NOT skip)
- Use **SVG line icons only** (Lucide/Heroicons, 24×24 viewBox, `w-5 h-5`/`w-6 h-6`, consistent 1.5-2px stroke). **No emojis as UI icons.**
- Status indicated by icon + label + color, never color alone.

## Page structure (top → bottom)
1. **Sticky top nav** (floating feel, `backdrop-blur`, translucent canvas bg, hairline bottom border). Left: brand - a small rounded-square logo mark reading **"SC"** (deep-forest fill, lime glyph) next to the wordmark **signalScout**. Center/right: nav links `Overview · Strategy · Evidence · Metrics · Operations`. **No "Open Agent" button** (the chat is inline). Add spacing from the top edge so it reads as floating.
2. **Overview hero** - a large deep-forest gradient card (`from-[#123F36] to-[#0B302A]`, radial lime glow top-right), `rounded-3xl`, generous padding. Two-column top row:
   - **Left:** lime eyebrow "Strategic change radar · validated replay"; giant company name headline; a `lede` sub-paragraph (max ~690px); one primary CTA **"Review strategy"** (lime pill, ink text).
   - **Right:** a **posture card** in solid lime with ink text - label "Recommended posture", a huge posture word (e.g. `ADAPT`), a one-line rationale, and a footer row (stage · index 0-100).
   - **Below, full width inside the hero:** the **inline evidence-agent chat** as a glass panel - header with a live lime status dot + "signalScout evidence agent" + "Ask signalScout"; a scrollable transcript (assistant bubbles = white/ink, user bubbles = lime/ink, rounded with one squared corner); a row of suggestion chips (outlined, pill); a composer with a textarea, a `x/4000` counter, and a lime **Send** button. Include a collapsible "Tool execution log" detail.
3. **Snapshot bar** - 4 equal stat tiles in a white bordered card that **overlaps the hero** (negative top margin, elevated). Stats: `As-of` (date), `Evidence visible` (n/total), `Metric coverage` (%), `Decision readiness` (Ready/Blocked). Each: tiny uppercase muted label + bold Manrope value.
4. **Strategy fit** - 3-column comparison of `MAINTAIN / ADAPT / ACCELERATE`, each a card with a fit score, a thin progress track, a short description, and a Cost/Benefit/Risk definition list. The selected posture card gets a lime top-inset accent + elevation. Include one **radial "fit ring"** gauge (conic-gradient style) as the section's visual anchor.
5. **Evidence timeline** ("What was knowable, when") - a **vertical timeline** with numbered circular markers connected by a hairline; each node is a white card: an "Approved" success chip + date, a title, an excerpt, and an "Open source ↗" link. Include an "As-of date" select control in the section header for historical replay.
6. **Pattern radar** ("Why this cluster matters") - 3 insight cards, each with a big amber index number `01/02/03`, a claim sentence, and small evidence-id chips.
7. **Metric lens** ("Coverage before conviction") - a coverage badge (green tile, big %) in the header, an optional amber "Blocked by missing metrics" notice, and a clean **data table** (Metric / Value / Period / Quality / Evidence) with success chips and monospace-ish numeric values. Table scrolls horizontally on mobile inside its own container.
8. **Operations dashboard** ("Observable by design") - a live badge (green pill, pulsing dot), a 6-up row of KPI metric cards, and two chart panels: a **horizontal bar chart** (provider/route distribution, amber bars) and a **line/area trend chart** (validation pass-rate & latency). Provide an empty-state for no data.
9. **Executive agenda** ("Decide with a challenger") - two cards: a green **recommendation card** (lime tag, bold headline, rationale, evidence-id links) and a white **challenger card** with a numbered list of challenger questions. When blocked, show a notice instead.
10. **Footer** - 3 columns: brand + tagline "Evidence-led strategic decision support."; a "…is fictional" disclaimer; and a methodology/limitations column. Muted small text, ink for the strong labels.

## Interaction & motion
- All clickable cards/links: `cursor-pointer`, clear hover feedback via **color/opacity/shadow/border** transitions (`transition-colors duration-200`), never scale transforms that shift layout.
- Visible focus rings (`focus-visible:outline` amber, offset) for keyboard nav.
- Respect `prefers-reduced-motion`. Smooth-scroll with `scroll-padding-top` to clear the sticky nav.

## Responsive
- Breakpoints at 375 / 768 / 1024 / 1440. Hero and all 2-3 col grids collapse to single column on tablet/mobile. Nav links become a horizontally scrollable row; hide the wordmark on very small screens (keep the mark). No horizontal page scroll - only the metric table may scroll inside its own `overflow-x-auto` wrapper. Container max-width ~1240px, centered.

## Contrast & polish rules (must pass)
- Light mode body text uses `#17211D`; muted no lighter than `#475569`/`#69736E`. Glass cards on the dark hero use `bg-white/7`+ with visible borders; light-mode glass uses `bg-white/80`+.
- Consistent icon sizing, consistent container max-width, consistent radius scale. Floating nav has edge spacing; content never hides behind it.

## Anti-patterns to avoid
Emoji icons; color-only status; low-contrast muted text; invisible borders; hover states that cause layout shift; mixed container widths; oversized/too-slow transitions (keep 150-300ms); giant hero text that overflows on mobile.

## Deliverables
1. A responsive Tailwind layout for the full page (all 10 sections), light **and** dark themes.
2. A `tailwind.config` theme extension with the color tokens, font families (Manrope, Inter), radius, and the two shadow presets above.
3. Reusable component blocks: `StatTile`, `PostureCard`, `InlineChat` (transcript bubble + composer + suggestion chip), `TimelineNode`, `InsightCard`, `MetricTable`, `KpiCard`, `BarChart`, `TrendChart`, `RecommendationCard`, `ChallengerCard`.
4. A component states sheet: default / hover / focus / disabled / loading / empty, in both themes.

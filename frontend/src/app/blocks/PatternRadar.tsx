import type { PatternRadarViz } from "@corpwatch/backend/contracts";

export function PatternRadar({ block }: { block: PatternRadarViz }) {
  return <section aria-label="Pattern radar">
    <div className="mb-5"><p className="eyebrow text-green2">Pattern radar</p><h3 className="font-display text-2xl font-bold mt-1">Why this cluster matters</h3></div>
    <div className="grid sm:grid-cols-3 gap-3">{block.claims.map((claim, index) =>
      <article key={claim.id} className="rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline p-5 flex flex-col min-h-[180px]">
        <span className="font-display font-bold text-3xl text-amber">0{index + 1}</span>
        <p className="flex-1 mt-4 text-sm leading-relaxed">{claim.text}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">{claim.evidenceIds.map((id) => <span key={id} className="px-2 py-1 rounded-md bg-soft dark:bg-dsurface2 text-xs text-ink dark:text-white/80">{id}</span>)}</div>
      </article>)}</div>
  </section>;
}

import type { OperationsViz } from "@corpwatch/backend/contracts";

export function OperationsCharts({ block }: { block: OperationsViz }) {
  const maxProvider = Math.max(1, ...block.providerDistribution.map((item) => item.count));
  const cards: Array<[string, string | number]> = [
    ["Chat turns", block.summary.totalRuns],
    ["Candidates", block.summary.candidates],
    ["Approved", block.summary.approved],
    ["Validation", `${Math.round(block.summary.validationPassRate * 100)}%`],
    ["Avg latency", `${Math.round(block.summary.averageLatencyMs)} ms`],
  ];
  return <section aria-label="Agent operations">
    <div className="mb-5"><p className="eyebrow text-green2">Agent operations</p><h3 className="font-display text-2xl font-bold mt-1">Observable by design</h3></div>
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">{cards.map(([label, value]) =>
      <article key={label} className="rounded-xl bg-paper dark:bg-dsurface border border-line dark:border-dline p-4"><span className="block text-muted dark:text-white/45 text-[.66rem] uppercase">{label}</span><strong className="block mt-2 font-display text-xl">{value}</strong></article>)}</div>
    <div className="grid lg:grid-cols-2 gap-3">
      <article className="rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline p-5">
        <h4 className="font-display text-base mb-4">Collector routes</h4>
        {block.providerDistribution.length ? block.providerDistribution.map((item) =>
          <div key={item.provider} className="grid grid-cols-[130px_1fr_28px] gap-2.5 items-center my-3 text-xs"><span className="text-muted dark:text-white/55">{item.provider.replaceAll("_", " ")}</span><div className="h-2.5 rounded-lg bg-soft dark:bg-dsurface2"><i className="block h-full rounded-lg bg-amber" style={{ width: `${(item.count / maxProvider) * 100}%` }} /></div><strong>{item.count}</strong></div>)
          : <EmptyChart text="No collector calls yet" />}
      </article>
      <article className="rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline p-5">
        <h4 className="font-display text-base mb-4">Validation trend</h4>
        {block.validationTrend.length
          ? <svg className="w-full h-[150px] text-green2" viewBox="0 0 420 150" role="img" aria-label="Validation pass rate trend"><path d="M20 20V130H400" fill="none" stroke="currentColor" strokeOpacity=".14" /><polyline fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={block.validationTrend.slice(-20).map((item, index, values) => `${20 + index * (380 / Math.max(1, values.length - 1))},${130 - item.passRate * 110}`).join(" ")} /></svg>
          : <EmptyChart text="No validation observations yet" />}
      </article>
    </div>
  </section>;
}

function EmptyChart({ text }: { text: string }) { return <div className="min-h-[140px] grid place-content-center text-center text-muted dark:text-white/40"><span className="text-3xl">—</span><p className="mt-1">{text}</p></div>; }

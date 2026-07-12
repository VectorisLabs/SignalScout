import type { MetricLensViz } from "@corpwatch/backend/contracts";

const cell = "px-4 py-3 border-b border-line dark:border-dline";
const th = "text-left font-semibold px-4 py-3 text-muted dark:text-white/45 text-[.7rem] uppercase tracking-wide border-b border-line dark:border-dline";

export function MetricLens({ block }: { block: MetricLensViz }) {
  return <section aria-label="Metric lens">
    <div className="flex flex-wrap justify-between items-end gap-4 mb-5">
      <div><p className="eyebrow text-green2">Metric lens</p><h3 className="font-display text-2xl font-bold mt-1">Coverage before conviction</h3></div>
      <div className="grid place-items-center min-w-[96px] p-3 rounded-2xl bg-forest text-white"><strong className="font-display text-2xl">{block.coverage}%</strong><span className="text-[.62rem] uppercase text-lime">coverage</span></div>
    </div>
    <div className="rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline shadow-panel overflow-x-auto">
      <table className="w-full border-collapse text-sm min-w-[520px]">
        <caption className="text-left p-4 text-muted dark:text-white/45 text-xs">Reported metric observations</caption>
        <thead><tr><th className={th}>Metric</th><th className={th}>Value</th><th className={th}>Period</th><th className={th}>Quality</th><th className={th}>Evidence</th></tr></thead>
        <tbody>{block.metrics.map((metric) =>
          <tr key={`${metric.label}-${metric.period}`}>
            <th className={`text-left font-medium ${cell}`}>{metric.label}</th>
            <td className={`font-bold ${cell}`}>{metric.value.toLocaleString()} <span className="text-muted dark:text-white/40 font-normal">{metric.unit === "USD_MILLIONS" ? "USD m" : "count"}</span></td>
            <td className={cell}>{metric.period}</td>
            <td className={cell}><span className="px-2 py-1 rounded-md bg-[#DAF0E5] text-[#146044] text-[.6rem] font-bold uppercase">{metric.quality}</span></td>
            <td className={cell}><span className="text-green2 font-semibold">{metric.evidenceId}</span></td>
          </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

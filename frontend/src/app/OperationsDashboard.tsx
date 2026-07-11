import { useEffect, useState } from "react";

interface AgentMetrics {
  summary: { totalRuns: number; successfulRuns: number; failedRuns: number; toolCalls: number; candidates: number; approved: number; validationPassRate: number; averageLatencyMs: number; inputTokens: number; outputTokens: number };
  providerDistribution: Array<{ provider: string; count: number }>;
  validationTrend: Array<{ at: string; passRate: number; latencyMs: number }>;
  recentRuns: Array<{ id: string; completedAt: string; status: string; provider: string; routingReason: string; latencyMs: number; candidates: number; approved: number; validationPassRate: number; model: string | null; traceId: string; traceUrl?: string | null; promptVersion?: number; promptSource?: string }>;
}

const cellBorder = "border-b border-line dark:border-dline";
const th = "text-left font-semibold px-4 py-3 text-muted dark:text-white/45 text-[.7rem] uppercase tracking-wide " + cellBorder;
const card = "rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline";

export function OperationsDashboard() {
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  useEffect(() => { let active = true; const load = () => fetch("/api/metrics").then((response) => response.ok ? response.json() : Promise.reject()).then((value: AgentMetrics) => { if (active && typeof value?.summary?.totalRuns === "number") setMetrics(value); }).catch(() => undefined); void load(); const timer = setInterval(load, 5000); return () => { active = false; clearInterval(timer); }; }, []);
  const summary = metrics?.summary;
  const cards: Array<[string, string | number]> = [["Chat turns", summary?.totalRuns ?? 0], ["Tool calls", summary?.toolCalls ?? 0], ["Candidates", summary?.candidates ?? 0], ["Approved", summary?.approved ?? 0], ["Validation", `${Math.round((summary?.validationPassRate ?? 0) * 100)}%`], ["Avg latency", `${Math.round(summary?.averageLatencyMs ?? 0)} ms`]];
  const maxProvider = Math.max(1, ...(metrics?.providerDistribution.map((item) => item.count) ?? [1]));
  const statusChip = (status: string) => status.toLowerCase() === "failed" || status.toLowerCase() === "config_required" ? "text-danger bg-[#f6e0dc]" : "text-[#146044] bg-[#DAF0E5]";

  return <section id="operations" className="pt-24 border-b border-line dark:border-dline" aria-labelledby="operations-title">
    <div className="flex flex-wrap justify-between items-end gap-6 mb-9">
      <div className="max-w-[760px]"><p className="eyebrow text-green2">Agent operations</p><h2 id="operations-title" className="section-title font-bold mt-2.5">Observable by design</h2><p className="mt-3 text-muted dark:text-white/55">Route, validation, latency and model activity. Updated every five seconds.</p></div>
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#dff0e9] text-[#23604e] text-sm font-bold"><i className="w-2 h-2 rounded-full bg-[#26a36f] pulse" /> Live audit</span>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">{cards.map(([label, value]) =>
      <article key={label} className={`${card} p-4`}><span className="block text-muted dark:text-white/45 text-[.68rem] uppercase">{label}</span><strong className="block mt-2 font-display text-2xl">{value}</strong></article>)}</div>

    <div className="grid lg:grid-cols-2 gap-4 mb-4">
      <article className={`${card} p-6`}>
        <h3 className="font-display text-lg mb-5">Collector routes</h3>
        {metrics?.providerDistribution.length ? metrics.providerDistribution.map((item) =>
          <div key={item.provider} className="grid grid-cols-[130px_1fr_28px] gap-2.5 items-center my-4 text-xs"><span className="text-muted dark:text-white/55">{item.provider.replaceAll("_", " ")}</span><div className="h-2.5 rounded-lg bg-soft dark:bg-dsurface2"><i className="block h-full rounded-lg bg-amber" style={{ width: `${(item.count / maxProvider) * 100}%` }} /></div><strong>{item.count}</strong></div>)
          : <EmptyChart text="No collector calls yet" />}
      </article>
      <article className={`${card} p-6`}>
        <h3 className="font-display text-lg mb-5">Validation trend</h3>
        {metrics?.validationTrend.length
          ? <svg className="w-full h-[150px] text-green2" viewBox="0 0 420 150" role="img" aria-label="Validation pass rate trend"><path d="M20 20V130H400" fill="none" stroke="currentColor" strokeOpacity=".14" /><polyline fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={metrics.validationTrend.slice(-20).map((item, index, values) => `${20 + index * (380 / Math.max(1, values.length - 1))},${130 - item.passRate * 110}`).join(" ")} /></svg>
          : <EmptyChart text="No validation observations yet" />}
      </article>
    </div>

    <div className={`${card} shadow-panel overflow-x-auto`}>
      <table className="w-full border-collapse text-sm min-w-[640px]">
        <caption className="text-left p-4 text-muted dark:text-white/45 text-xs">Recent agent runs</caption>
        <thead><tr><th className={th}>Completed</th><th className={th}>Status</th><th className={th}>Route</th><th className={th}>Validation</th><th className={th}>Latency</th><th className={th}>Model / prompt / trace</th></tr></thead>
        <tbody>{metrics?.recentRuns.length ? metrics.recentRuns.map((run) =>
          <tr key={run.id}>
            <td className={`px-4 py-3.5 ${cellBorder}`}>{new Date(run.completedAt).toLocaleTimeString()}</td>
            <td className={`px-4 py-3.5 ${cellBorder}`}><span className={`px-2 py-1 rounded-md text-[.62rem] font-bold uppercase ${statusChip(run.status)}`}>{run.status}</span></td>
            <td className={`px-4 py-3.5 ${cellBorder}`}>{run.provider}<small className="block text-muted dark:text-white/40 mt-1">{run.routingReason}</small></td>
            <td className={`px-4 py-3.5 ${cellBorder}`}>{Math.round(run.validationPassRate * 100)}% · {run.approved}/{run.candidates}</td>
            <td className={`px-4 py-3.5 ${cellBorder}`}>{run.latencyMs} ms</td>
            <td className={`px-4 py-3.5 ${cellBorder}`}>{run.model ?? "not reported"}<small className="block text-muted dark:text-white/40 mt-1">{run.promptSource ?? "local"} · prompt v{run.promptVersion ?? 0}</small>{run.traceUrl ? <a href={run.traceUrl} target="_blank" rel="noreferrer" className="inline-block mt-1.5 text-green2 font-semibold text-xs">Open Langfuse trace ↗</a> : <small className="block text-muted dark:text-white/40">{run.traceId}</small>}</td>
          </tr>) : <tr><td colSpan={6} className="px-4 py-3.5">Open the evidence agent to create the first run log.</td></tr>}</tbody>
      </table>
    </div>
  </section>;
}

function EmptyChart({ text }: { text: string }) { return <div className="min-h-[160px] grid place-content-center text-center text-muted dark:text-white/40"><span className="text-3xl">-</span><p className="mt-1">{text}</p></div>; }

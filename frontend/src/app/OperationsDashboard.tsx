import { useEffect, useState } from "react";

interface AgentMetrics {
  summary: { totalRuns: number; successfulRuns: number; failedRuns: number; toolCalls: number; candidates: number; approved: number; validationPassRate: number; averageLatencyMs: number; inputTokens: number; outputTokens: number };
  providerDistribution: Array<{ provider: string; count: number }>;
  validationTrend: Array<{ at: string; passRate: number; latencyMs: number }>;
  recentRuns: Array<{ id: string; completedAt: string; status: string; provider: string; routingReason: string; latencyMs: number; candidates: number; approved: number; validationPassRate: number; model: string | null; traceId: string; traceUrl?: string | null; promptVersion?: number; promptSource?: string }>;
}

export function OperationsDashboard() {
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  useEffect(() => { let active = true; const load = () => fetch("/api/metrics").then((response) => response.ok ? response.json() : Promise.reject()).then((value: AgentMetrics) => { if (active && typeof value?.summary?.totalRuns === "number") setMetrics(value); }).catch(() => undefined); void load(); const timer = setInterval(load, 5000); return () => { active = false; clearInterval(timer); }; }, []);
  const summary = metrics?.summary;
  const cards = [["Chat turns", summary?.totalRuns ?? 0], ["Tool calls", summary?.toolCalls ?? 0], ["Candidates", summary?.candidates ?? 0], ["Approved", summary?.approved ?? 0], ["Validation", `${Math.round((summary?.validationPassRate ?? 0) * 100)}%`], ["Avg latency", `${Math.round(summary?.averageLatencyMs ?? 0)} ms`]];
  const maxProvider = Math.max(1, ...(metrics?.providerDistribution.map((item) => item.count) ?? [1]));
  return <section id="operations" className="section-block operations" aria-labelledby="operations-title"><div className="section-heading"><div><p className="eyebrow">Agent operations</p><h2 id="operations-title">Observable by design</h2><p>Route, validation, latency and model activity. Updated every five seconds.</p></div><span className="live-badge"><i /> Live audit</span></div>
    <div className="metric-cards">{cards.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <div className="chart-grid"><article className="panel"><h3>Collector routes</h3>{metrics?.providerDistribution.length ? metrics.providerDistribution.map((item) => <div className="bar-row" key={item.provider}><span>{item.provider.replaceAll("_", " ")}</span><div><i style={{ width: `${(item.count / maxProvider) * 100}%` }} /></div><strong>{item.count}</strong></div>) : <EmptyChart text="No collector calls yet" />}</article>
      <article className="panel"><h3>Validation trend</h3>{metrics?.validationTrend.length ? <svg className="trend-chart" viewBox="0 0 420 150" role="img" aria-label="Validation pass rate trend"><path d="M20 20V130H400" className="axis" /><polyline fill="none" stroke="currentColor" strokeWidth="4" points={metrics.validationTrend.slice(-20).map((item, index, values) => `${20 + index * (380 / Math.max(1, values.length - 1))},${130 - item.passRate * 110}`).join(" ")} /></svg> : <EmptyChart text="No validation observations yet" />}</article></div>
    <div className="table-wrap panel"><table><caption>Recent agent runs</caption><thead><tr><th>Completed</th><th>Status</th><th>Route</th><th>Validation</th><th>Latency</th><th>Model / prompt / trace</th></tr></thead><tbody>{metrics?.recentRuns.length ? metrics.recentRuns.map((run) => <tr key={run.id}><td>{new Date(run.completedAt).toLocaleTimeString()}</td><td><span className={`status-pill ${run.status.toLowerCase()}`}>{run.status}</span></td><td>{run.provider}<small>{run.routingReason}</small></td><td>{Math.round(run.validationPassRate * 100)}% · {run.approved}/{run.candidates}</td><td>{run.latencyMs} ms</td><td>{run.model ?? "not reported"}<small>{run.promptSource ?? "local"} · prompt v{run.promptVersion ?? 0}</small>{run.traceUrl ? <a href={run.traceUrl} target="_blank" rel="noreferrer">Open Langfuse trace ↗</a> : <small>{run.traceId}</small>}</td></tr>) : <tr><td colSpan={6}>Open the evidence agent to create the first run log.</td></tr>}</tbody></table></div>
  </section>;
}
function EmptyChart({ text }: { text: string }) { return <div className="empty-chart"><span>—</span><p>{text}</p></div>; }

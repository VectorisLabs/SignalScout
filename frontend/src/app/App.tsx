import { useEffect, useMemo, useState } from "react";
import { CasePackageSchema, type CasePackage } from "@corpwatch/backend/contracts";
import { InlineChat } from "./InlineChat";
import { OperationsDashboard } from "./OperationsDashboard";
import { StrategyFitChart } from "./StrategyFitChart";

type LoadState = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; data: CasePackage };
const metricLabels: Record<string, string> = { revenue: "Revenue / net sales", gross_profit: "Gross profit", operating_income: "Operating income", sga: "SG&A", restructuring_cost: "Restructuring cost", cash_and_equivalents: "Cash & equivalents", operating_cash_flow: "Operating cash flow", capital_expenditure: "Capital expenditure", inventory: "Inventory", accounts_payable: "Accounts payable", short_term_debt: "Short-term debt", long_term_debt: "Long-term debt", store_count: "Store count", employee_count: "Employee count" };

const cellBorder = "border-b border-line dark:border-dline";
const th = "text-left font-semibold px-4 py-3 text-muted dark:text-white/45 text-[.7rem] uppercase tracking-wide " + cellBorder;

export function App() {
  const [state, setState] = useState<LoadState>({ kind: "loading" }); const [frameIndex, setFrameIndex] = useState(0);
  useEffect(() => { let active = true; fetch("/demo/case-package.json").then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }).then((json) => CasePackageSchema.parse(json)).then((data) => { if (active) { setState({ kind: "ready", data }); setFrameIndex(data.replay.length - 1); } }).catch(() => { if (active) setState({ kind: "error", message: "The validated offline case bundle could not be loaded. Run npm run build:case and validate:public-bundle." }); }); return () => { active = false; }; }, []);
  if (state.kind === "loading") return <main className="min-h-screen grid place-content-center justify-items-center text-center p-6 bg-canvas text-ink dark:bg-dcanvas dark:text-white"><div className="w-9 h-9 mb-4 rounded-full border-[3px] border-line border-t-forest animate-spin" /><p role="status">Loading validated strategic brief…</p></main>;
  if (state.kind === "error") return <main className="min-h-screen grid place-content-center justify-items-center text-center p-6 bg-canvas text-ink dark:bg-dcanvas dark:text-white"><p className="eyebrow text-green2">signalScout</p><h1 className="text-6xl font-display font-bold my-4">Bundle unavailable</h1><div role="alert" className="max-w-md p-4 rounded-lg bg-[#fff1dc] text-ink border-l-4 border-amber">{state.message}</div></main>;
  return <div className="bg-canvas text-ink dark:bg-dcanvas dark:text-white/90 min-h-screen"><DashboardNav /><Dashboard data={state.data} frameIndex={frameIndex} setFrameIndex={setFrameIndex} /></div>;
}

function DashboardNav() {
  const [dark, setDark] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  const link = "whitespace-nowrap hover:text-ink dark:hover:text-white transition-colors";
  return <header className="sticky top-0 z-30 border-b border-line/80 dark:border-dline/80 bg-canvas/80 dark:bg-dcanvas/80 backdrop-blur-xl">
    <div className="mx-auto max-w-shell px-5 h-[68px] flex items-center gap-6">
      <a href="#overview" className="flex items-center gap-2.5 shrink-0" aria-label="signalScout dashboard home"><span className="grid place-items-center w-9 h-9 rounded-xl bg-forest text-lime font-display font-extrabold text-xs">SC</span><strong className="font-display tracking-tight hidden sm:block">signalScout</strong></a>
      <nav aria-label="Primary navigation" className="flex-1 flex items-center gap-6 overflow-x-auto no-scrollbar text-sm font-semibold text-muted dark:text-white/55">
        <a href="#overview" className={link}>Overview</a><a href="#strategy" className={link}>Strategy</a><a href="#replay" className={link}>Evidence</a><a href="#metrics" className={link}>Metrics</a><a href="#operations" className={link}>Operations</a>
      </nav>
      <button onClick={() => setDark((value) => !value)} aria-label="Toggle color theme" className="shrink-0 grid place-items-center w-9 h-9 rounded-xl border border-line dark:border-dline text-muted dark:text-white/60 hover:text-ink dark:hover:text-white cursor-pointer transition-colors">
        {dark
          ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></svg>}
      </button>
    </div>
  </header>;
}

function Dashboard({ data, frameIndex, setFrameIndex }: { data: CasePackage; frameIndex: number; setFrameIndex: (value: number) => void }) {
  const frame = data.replay[frameIndex]; const visible = useMemo(() => new Set(frame.evidenceIds), [frame]); const blocked = data.readiness.filter((item) => item.status !== "READY"); const decisionsBlocked = blocked.length > 0;
  const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));
  const coverage = Math.min(100, Math.round((new Set(data.metrics.map((item) => item.metricKey)).size / 14) * 100)); const latestEvidence = data.evidence.filter((item) => visible.has(item.id));
  const arrow = <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7m0 0H8m9 0v9" /></svg>;
  const card = "rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline";
  const chip = "inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#DAF0E5] text-[#146044] text-[.62rem] font-extrabold uppercase tracking-wide";
  const evidenceLink = "mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-green2 hover:underline";

  return <main className="mx-auto max-w-shell px-5 pb-20">
    {/* Overview hero */}
    <section id="overview" className="mt-7 rounded-[28px] shadow-brand text-white bg-gradient-to-br from-forest to-[#0B302A] relative overflow-hidden">
      <div className="absolute inset-0 glow pointer-events-none" />
      <div className="relative p-7 sm:p-12 grid gap-9">
        <div className="grid lg:grid-cols-[1.45fr_.72fr] gap-8 lg:gap-12 items-end">
          <div>
            <p className="eyebrow text-lime">Strategic change radar · validated replay</p>
            <h1 className="hero-name font-display font-extrabold mt-3 mb-5">{data.company.name}</h1>
            <p className="max-w-[640px] text-[1.12rem] leading-relaxed text-white/80">{data.watchQuestion}</p>
            <div className="mt-7"><a href="#strategy" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-lime text-ink font-bold cursor-pointer hover:bg-lime/90 transition-colors">Review strategy<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" /></svg></a></div>
          </div>
          <div className="rounded-2xl bg-lime text-ink p-6">
            <span className="eyebrow">Recommended posture</span>
            <strong className="block font-display text-[2.7rem] leading-none tracking-tight my-3">{data.recommendation.posture}</strong>
            <p className="text-sm leading-relaxed">{data.recommendation.rationale}</p>
            <div className="flex justify-between pt-3 mt-4 border-t border-ink/20 text-sm font-bold"><small>{frame.stage}</small><small>Index {Math.round(frame.score * 100)}/100</small></div>
          </div>
        </div>
        <InlineChat />
      </div>
    </section>

    {/* Snapshot */}
    <section aria-label="Case snapshot" className="relative z-10 -mt-6 mx-auto w-[calc(100%-2rem)] grid grid-cols-2 sm:grid-cols-4 rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline shadow-brand">
      {[["As-of", formatDate(frame.asOf)], ["Evidence visible", `${latestEvidence.length}/${data.evidence.length}`], ["Metric coverage", `${coverage}%`], ["Decision readiness", decisionsBlocked ? "Blocked" : "Ready"]].map(([label, value], index) =>
        <article key={label} className={`p-5 sm:p-6 ${index < 3 ? "sm:border-r border-line dark:border-dline" : ""} ${index < 2 ? "border-r sm:border-r-0 border-b sm:border-b-0 border-line dark:border-dline" : ""}`}>
          <span className="block mb-1.5 text-muted dark:text-white/45 text-[.7rem] uppercase tracking-wide">{label}</span>
          <strong className="font-display text-xl">{value}</strong>
        </article>)}
    </section>

    <StrategyFitChart data={data} visibleEvidence={visible} blocked={decisionsBlocked} />

    {/* Evidence timeline */}
    <section id="replay" className="pt-24 border-b border-line dark:border-dline" aria-labelledby="replay-title">
      <div className="flex flex-wrap justify-between items-end gap-6 mb-9">
        <div className="max-w-[760px]"><p className="eyebrow text-green2">Evidence timeline</p><h2 id="replay-title" className="section-title font-bold mt-2.5">What was knowable, when</h2><p className="mt-3 text-muted dark:text-white/55">{frame.summary}</p></div>
        <label className="min-w-[190px] text-muted dark:text-white/50 text-xs font-bold uppercase tracking-wide">Historical frame
          <select aria-label="As-of date" value={frameIndex} onChange={(event) => setFrameIndex(Number(event.target.value))} className="w-full mt-2 px-3 py-2.5 rounded-lg bg-paper dark:bg-dsurface border border-line dark:border-dline text-ink dark:text-white font-medium normal-case cursor-pointer">
            {data.replay.map((item, index) => <option key={item.asOf} value={index}>{formatDate(item.asOf)}</option>)}
          </select>
        </label>
      </div>
      {latestEvidence.length === 0
        ? <p className="max-w-md p-4 rounded-lg bg-[#fff1dc] text-ink border-l-4 border-amber dark:text-ink">No approved evidence is available for this frame.</p>
        : <ol className="max-w-[940px] space-y-7">{latestEvidence.map((item, index) =>
            <li key={item.id} className="grid grid-cols-[52px_1fr] gap-5">
              <div><span className="grid place-items-center w-11 h-11 rounded-full bg-forest text-white border-4 border-canvas dark:border-dcanvas text-xs font-extrabold">{String(index + 1).padStart(2, "0")}</span></div>
              <article className={`${card} p-6`}>
                <div className="flex justify-between items-center"><span className={chip}><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m20 6-11 11-5-5" /></svg>Approved</span><time className="text-muted dark:text-white/45 text-xs">{formatDate(item.publiclyAvailableAt)}</time></div>
                <h3 id={`evidence-${item.id}`} className="font-display mt-3 mb-2">{item.title}</h3>
                <p className="text-[#4e5a55] dark:text-white/60 text-sm leading-relaxed">{item.excerpt}</p>
                <a href={data.sources.find((source) => source.id === item.sourceId)?.url} target="_blank" rel="noreferrer" className={evidenceLink}>Open source {arrow}</a>
              </article>
            </li>)}</ol>}
    </section>

    {/* Pattern radar */}
    <section id="radar" className="pt-24 border-b border-line dark:border-dline" aria-labelledby="radar-title">
      <div className="mb-9"><p className="eyebrow text-green2">Pattern radar</p><h2 id="radar-title" className="section-title font-bold mt-2.5">Why this cluster matters</h2></div>
      <div className="grid md:grid-cols-3 gap-4">{data.claims.filter((claim) => claim.evidenceIds.every((id) => visible.has(id))).slice(0, 3).map((claim, index) =>
        <article key={claim.id} className={`${card} p-6 flex flex-col min-h-[210px]`}>
          <span className="font-display font-bold text-3xl text-amber">0{index + 1}</span>
          <p className="flex-1 mt-5 text-sm leading-relaxed">{claim.text}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">{claim.evidenceIds.map((id) => <a key={id} href={`#evidence-${id}`} className="px-2 py-1 rounded-md bg-soft dark:bg-dsurface2 text-xs no-underline text-ink dark:text-white/80">{id}</a>)}</div>
        </article>)}</div>
    </section>

    {/* Metric lens */}
    <section id="metrics" className="pt-24 border-b border-line dark:border-dline" aria-labelledby="metrics-title">
      <div className="flex flex-wrap justify-between items-end gap-6 mb-9">
        <div className="max-w-[760px]"><p className="eyebrow text-green2">Metric lens</p><h2 id="metrics-title" className="section-title font-bold mt-2.5">Coverage before conviction</h2><p className="mt-3 text-muted dark:text-white/55">Reported observations, normalized units and direct provenance.</p></div>
        <div className="grid place-items-center min-w-[104px] p-4 rounded-2xl bg-forest text-white"><strong className="font-display text-2xl">{coverage}%</strong><span className="text-[.68rem] uppercase text-lime">coverage</span></div>
      </div>
      {blocked.length > 0 && <div role="status" className="mb-4 p-4 rounded-lg bg-[#fff1dc] text-ink border-l-4 border-amber"><strong>Blocked by missing metrics</strong><p className="mt-1 text-sm">{[...new Set(blocked.flatMap((item) => item.missingMetrics))].map((key) => metricLabels[key]).join(", ")}</p></div>}
      <div className={`${card} shadow-panel overflow-x-auto`}>
        <table className="w-full border-collapse text-sm min-w-[560px]">
          <caption className="text-left p-4 text-muted dark:text-white/45 text-xs">Reported metric observations</caption>
          <thead><tr><th className={th}>Metric</th><th className={th}>Value</th><th className={th}>Period</th><th className={th}>Quality</th><th className={th}>Evidence</th></tr></thead>
          <tbody>{data.metrics.map((metric) =>
            <tr key={`${metric.metricKey}-${metric.period}`}>
              <th className={`text-left font-medium px-4 py-3.5 ${cellBorder}`}>{metricLabels[metric.metricKey]}</th>
              <td className={`px-4 py-3.5 font-bold ${cellBorder}`}>{metric.value.toLocaleString()} <span className="text-muted dark:text-white/40 font-normal">{metric.unit === "USD_MILLIONS" ? "USD m" : "count"}</span></td>
              <td className={`px-4 py-3.5 ${cellBorder}`}>{metric.period}</td>
              <td className={`px-4 py-3.5 ${cellBorder}`}><span className="px-2 py-1 rounded-md bg-[#DAF0E5] text-[#146044] text-[.62rem] font-bold uppercase">{metric.quality}</span></td>
              <td className={`px-4 py-3.5 ${cellBorder}`}><a href={`#evidence-${metric.evidenceId}`} className="text-green2 font-semibold">{metric.evidenceId}</a></td>
            </tr>)}</tbody>
        </table>
      </div>
    </section>

    <OperationsDashboard />

    {/* Executive agenda */}
    <section id="agenda" className="pt-24 border-b border-line dark:border-dline" aria-labelledby="agenda-title">
      <div className="mb-9"><p className="eyebrow text-green2">Executive agenda</p><h2 id="agenda-title" className="section-title font-bold mt-2.5">Decide with a challenger</h2></div>
      {decisionsBlocked
        ? <div className="p-4 rounded-lg bg-[#fff1dc] text-ink border-l-4 border-amber"><strong>Executive recommendation blocked</strong><p className="mt-1 text-sm">Collect missing metrics before leadership review.</p></div>
        : <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-4">
            <article className="rounded-2xl bg-forest text-white p-8">
              <span className="inline-block px-2.5 py-1 rounded-md bg-lime text-ink text-[.62rem] font-extrabold uppercase tracking-wide">Recommended · {data.recommendation.posture}</span>
              <h3 className="font-display text-3xl max-w-[520px] my-6">Move deliberately, preserve optionality.</h3>
              <p className="text-white/75 leading-relaxed">{data.recommendation.rationale}</p>
              <p className="mt-5 text-sm text-white/60">Evidence {data.recommendation.evidenceIds.map((id) => <a key={id} href={`#evidence-${id}`} className="inline-block ml-1 px-2 py-1 rounded-md bg-white/10 text-white no-underline">{id}</a>)}</p>
            </article>
            <article className={`${card} p-8`}>
              <h3 className="font-display text-xl mb-4">Challenger questions</h3>
              <ol className="list-decimal pl-5">{data.challengerQuestions.map((question, index, list) => <li key={question} className={`py-3.5 pl-2 leading-relaxed ${index < list.length - 1 ? "border-b border-line dark:border-dline" : ""}`}>{question}</li>)}</ol>
            </article>
          </div>}
    </section>

    {/* Footer */}
    <footer className="grid sm:grid-cols-3 gap-8 pt-11 pb-2 text-muted dark:text-white/50 text-sm">
      <div><strong className="text-ink dark:text-white font-display">signalScout</strong><p className="mt-2">Evidence-led strategic decision support.</p></div>
      <div><strong className="text-ink dark:text-white">Northstar Home Retail is fictional.</strong><p className="mt-2">{data.company.comparisonContext}</p></div>
      <div><strong className="text-ink dark:text-white">Methodology</strong><p className="mt-2">{data.limitations.join(" ")}</p></div>
    </footer>
  </main>;
}

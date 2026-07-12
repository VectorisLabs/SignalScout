import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CasePackageSchema, type CasePackage, type ChatVisualization } from "@corpwatch/backend/contracts";
import { ArtifactRenderer } from "../ArtifactRenderer";
import { ThemeToggle } from "../ThemeToggle";
import { ChatDock } from "../ChatDock";
import { useInvestigation } from "../investigation";
import { postureViz, strategyFitViz, metricLensViz, timelineViz, patternRadarViz, operationsViz } from "../caseBlocks";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));

export function DashboardPage() {
  const { investigation } = useInvestigation();
  const [data, setData] = useState<CasePackage | null>(null);
  const [metricsBlock, setMetricsBlock] = useState<ChatVisualization | null>(null);

  // Always load the validated dashboard: it is both the standalone view and the fallback
  // whenever the live investigation has no visual artifacts to show.
  useEffect(() => {
    let active = true;
    fetch("/demo/case-package.json").then((response) => response.ok ? response.json() : Promise.reject()).then((json) => CasePackageSchema.parse(json)).then((value) => { if (active) setData(value); }).catch(() => undefined);
    fetch("/api/metrics").then((response) => response.ok ? response.json() : Promise.reject()).then((value) => { if (active && typeof value?.summary?.totalRuns === "number") setMetricsBlock(operationsViz(value)); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const showInvestigation = Boolean(investigation && investigation.visualizations.length > 0);

  return <div className="min-h-screen bg-canvas text-ink dark:bg-dcanvas dark:text-white/90">
    <DashboardHeader />
    {/* Combined workspace: chat docked on the left, live dashboard on the right. */}
    <div className="mx-auto max-w-shell flex flex-col lg:flex-row lg:items-start">
      <aside className="lg:w-[380px] lg:shrink-0 lg:sticky lg:top-[68px] lg:h-[calc(100vh-68px)] h-[55vh] border-b lg:border-b-0 lg:border-r border-line dark:border-dline">
        <ChatDock />
      </aside>
      <main className="flex-1 min-w-0 px-5 py-8">
        {showInvestigation ? <InvestigationView /> : data ? <CaseView data={data} metricsBlock={metricsBlock} /> : <Loading />}
      </main>
    </div>
  </div>;
}

function DashboardHeader() {
  const link = "whitespace-nowrap hover:text-ink dark:hover:text-white transition-colors";
  return <header className="sticky top-0 z-30 border-b border-line/80 dark:border-dline/80 bg-canvas/80 dark:bg-dcanvas/80 backdrop-blur-xl">
    <div className="mx-auto max-w-shell px-5 h-[68px] flex items-center gap-6">
      <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="signalScout home"><span className="grid place-items-center w-9 h-9 rounded-xl bg-forest text-lime font-display font-extrabold text-xs">SC</span><strong className="font-display tracking-tight hidden sm:block">signalScout</strong></Link>
      <nav aria-label="Primary navigation" className="flex-1 flex items-center gap-6 overflow-x-auto no-scrollbar text-sm font-semibold text-muted dark:text-white/55">
        <Link to="/" className={link}>Home</Link><Link to="/chat" className={link}>Chat</Link><span className="text-ink dark:text-white">Dashboard</span>
      </nav>
      <ThemeToggle />
      <Link to="/chat" className="shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-forest text-white text-sm font-bold hover:bg-green2 cursor-pointer transition-colors">Back to chat</Link>
    </div>
  </header>;
}

function InvestigationView() {
  const { investigation } = useInvestigation();
  if (!investigation) return null;
  return <>
    <div className="mb-8">
      <p className="eyebrow text-green2">Investigation dashboard · {investigation.mode === "offline" ? "offline replay" : "live"}</p>
      <h1 className="section-title font-bold mt-2.5">{investigation.question}</h1>
      <p className="mt-4 max-w-3xl text-muted dark:text-white/60 leading-relaxed whitespace-pre-wrap">{investigation.answer}</p>
    </div>
    {investigation.visualizations.length > 0
      ? <ArtifactRenderer blocks={investigation.visualizations} />
      : <div className="p-6 rounded-2xl border border-line dark:border-dline text-muted dark:text-white/60">This investigation returned no visual artifacts. Approved evidence renders here once the Evidence Gate clears candidates.</div>}
  </>;
}

function CaseView({ data, metricsBlock }: { data: CasePackage; metricsBlock: ChatVisualization | null }) {
  const frame = data.replay[data.replay.length - 1];
  const coverage = Math.min(100, Math.round((new Set(data.metrics.map((metric) => metric.metricKey)).size / 14) * 100));
  const decisionsBlocked = data.readiness.some((item) => item.status !== "READY");
  const blocks: ChatVisualization[] = [postureViz(data), strategyFitViz(data), metricLensViz(data), timelineViz(data, frame), patternRadarViz(data), ...(metricsBlock ? [metricsBlock] : [])];
  const snapshot: Array<[string, string]> = [["As-of", formatDate(frame.asOf)], ["Evidence visible", `${frame.evidenceIds.length}/${data.evidence.length}`], ["Metric coverage", `${coverage}%`], ["Decision readiness", decisionsBlocked ? "Blocked" : "Ready"]];
  return <>
    <div className="mb-6">
      <p className="eyebrow text-green2">Executive dashboard · validated replay</p>
      <h1 className="section-title font-bold mt-2.5">{data.company.name}</h1>
      <p className="mt-3 max-w-3xl text-muted dark:text-white/60">{data.watchQuestion}</p>
    </div>
    <section aria-label="Case snapshot" className="grid grid-cols-2 sm:grid-cols-4 rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline mb-8">
      {snapshot.map(([label, value], index) => <article key={label} className={`p-5 ${index < 3 ? "sm:border-r border-line dark:border-dline" : ""} ${index < 2 ? "border-r sm:border-r-0 border-b sm:border-b-0 border-line dark:border-dline" : ""}`}>
        <span className="block mb-1.5 text-muted dark:text-white/45 text-[.7rem] uppercase tracking-wide">{label}</span><strong className="font-display text-xl">{value}</strong>
      </article>)}
    </section>
    <ArtifactRenderer blocks={blocks} />
    <section aria-label="Executive agenda" className="mt-8 grid lg:grid-cols-[1.1fr_.9fr] gap-4">
      <article className="rounded-2xl bg-forest text-white p-8">
        <span className="inline-block px-2.5 py-1 rounded-md bg-lime text-ink text-[.62rem] font-extrabold uppercase tracking-wide">Recommended · {data.recommendation.posture}</span>
        <h2 className="font-display text-2xl max-w-[520px] my-5">Move deliberately, preserve optionality.</h2>
        <p className="text-white/75 leading-relaxed">{data.recommendation.rationale}</p>
      </article>
      <article className="rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline p-8">
        <h2 className="font-display text-lg mb-4">Challenger questions</h2>
        <ol className="list-decimal pl-5">{data.challengerQuestions.map((question, index, list) => <li key={question} className={`py-3 pl-2 leading-relaxed ${index < list.length - 1 ? "border-b border-line dark:border-dline" : ""}`}>{question}</li>)}</ol>
      </article>
    </section>
  </>;
}

function Loading() { return <div className="grid place-content-center py-24 text-muted dark:text-white/50"><div className="w-8 h-8 rounded-full border-[3px] border-line border-t-forest animate-spin mx-auto mb-3" /><p role="status">Loading dashboard…</p></div>; }

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CasePackageSchema, type CasePackage, type PostureViz, type StrategyFitViz, type MetricLensViz, type EvidenceTimelineViz } from "@corpwatch/backend/contracts";
import { SiteNav } from "../SiteNav";
import { PostureCard } from "../blocks/PostureCard";
import { StrategyFit } from "../blocks/StrategyFit";
import { MetricLens } from "../blocks/MetricLens";
import { EvidenceTimeline } from "../blocks/EvidenceTimeline";

const metricLabels: Record<string, string> = { revenue: "Revenue / net sales", gross_profit: "Gross profit", operating_income: "Operating income", sga: "SG&A", restructuring_cost: "Restructuring cost", cash_and_equivalents: "Cash & equivalents", operating_cash_flow: "Operating cash flow", capital_expenditure: "Capital expenditure", inventory: "Inventory", accounts_payable: "Accounts payable", short_term_debt: "Short-term debt", long_term_debt: "Long-term debt", store_count: "Store count", employee_count: "Employee count" };
const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));

const postureViz = (data: CasePackage): PostureViz => { const frame = data.replay[data.replay.length - 1]; return { kind: "posture", posture: data.recommendation.posture, index: Math.round(frame.score * 100), stage: frame.stage, rationale: data.recommendation.rationale, evidenceIds: data.recommendation.evidenceIds }; };
const strategyFitViz = (data: CasePackage): StrategyFitViz => ({ kind: "strategyFit", recommended: data.recommendation.posture, scenarios: data.scenarios.map((scenario) => ({ posture: scenario.posture, headline: scenario.headline, score: 35 + 30 + (scenario.posture === data.recommendation.posture ? 25 : 5) + 10, cost: scenario.cost, benefit: scenario.benefit, risk: scenario.risk, impact: scenario.impact })) });
const metricLensViz = (data: CasePackage): MetricLensViz => ({ kind: "metricLens", coverage: Math.min(100, Math.round((new Set(data.metrics.map((metric) => metric.metricKey)).size / 14) * 100)), metrics: data.metrics.map((metric) => ({ label: metricLabels[metric.metricKey] ?? metric.metricKey, value: metric.value, unit: metric.unit, period: metric.period, quality: metric.quality, evidenceId: metric.evidenceId })) });
const timelineViz = (data: CasePackage, frame: CasePackage["replay"][number]): EvidenceTimelineViz => ({ kind: "evidenceTimeline", asOf: frame.asOf, items: data.evidence.filter((item) => frame.evidenceIds.includes(item.id)).map((item) => ({ id: item.id, title: item.title, excerpt: item.excerpt, date: item.publiclyAvailableAt, sourceUrl: data.sources.find((source) => source.id === item.sourceId)?.url ?? null, status: "Approved" })) });

export function LandingPage() {
  const [data, setData] = useState<CasePackage | null>(null);
  useEffect(() => { let active = true; fetch("/demo/case-package.json").then((response) => response.ok ? response.json() : Promise.reject()).then((json) => CasePackageSchema.parse(json)).then((value) => { if (active) setData(value); }).catch(() => undefined); return () => { active = false; }; }, []);

  return <div id="top" className="bg-canvas text-ink dark:bg-dcanvas dark:text-white/90 min-h-screen">
    <SiteNav />
    <main className="mx-auto max-w-shell px-5 pb-20">
      {/* Hero */}
      <section className="mt-7 rounded-[28px] shadow-brand text-white bg-gradient-to-br from-forest to-[#0B302A] relative overflow-hidden">
        <div className="absolute inset-0 glow pointer-events-none" />
        <div className="relative p-8 sm:p-14 text-center">
          <p className="eyebrow text-lime">Evidence-led strategic change radar</p>
          <h1 className="hero-name font-display font-extrabold mt-4 mb-5 max-w-4xl mx-auto">See the change before the headline.</h1>
          <p className="max-w-2xl mx-auto text-[1.15rem] leading-relaxed text-white/80">signalScout investigates public corporate-change signals and returns cited, replayable evidence — with a bounded decision posture and visual artifacts you can defend.</p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/chat" className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-lime text-ink font-bold cursor-pointer hover:bg-lime/90 transition-colors">Open signalScout<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" /></svg></Link>
            <a href="#how" className="inline-flex items-center h-12 px-6 rounded-xl bg-white/8 border border-white/25 text-white font-bold cursor-pointer hover:bg-white/15 transition-colors">How it works</a>
          </div>
        </div>
      </section>

      {/* Product / features */}
      <section id="product" className="pt-24">
        <div className="max-w-[760px] mb-9"><p className="eyebrow text-green2">Why signalScout</p><h2 className="section-title font-bold mt-2.5">Conviction that survives scrutiny.</h2></div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ["Cited evidence, not guesses", "Every claim links to approved, rights-cleared public disclosures. Pending or rejected candidates never appear as facts.", "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"],
            ["Three decision postures", "MAINTAIN, ADAPT or ACCELERATE — with a bounded fit index that frames a review posture, not a forecast.", "M3 3v18h18M8 15l3-4 3 2 4-6"],
            ["Replayable & temporal-safe", "See what was knowable, when. Historical replay never leaks a future outcome into an earlier frame.", "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"],
          ].map(([title, body, path]) => <article key={title} className="rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline p-6">
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-soft dark:bg-dsurface2 text-green2 mb-4"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={path} /></svg></span>
            <h3 className="font-display text-lg">{title}</h3><p className="mt-2 text-sm text-muted dark:text-white/55 leading-relaxed">{body}</p>
          </article>)}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="pt-24">
        <div className="max-w-[760px] mb-9"><p className="eyebrow text-green2">How it works</p><h2 className="section-title font-bold mt-2.5">Signal → Evidence Gate → Posture.</h2></div>
        <div className="grid md:grid-cols-3 gap-4">
          {[["01", "Detect the signal", "Ask about a company, filing or known URL. A neutral tool requests public evidence; policy picks the collector route."], ["02", "Validate the evidence", "The Evidence Gate checks schema, public URL, replay time, content and rights — fail-closed, approved-only."], ["03", "Decide with artifacts", "The answer arrives with a posture card, fit ring, evidence timeline, metric lens and operations charts."]].map(([num, title, body]) =>
            <article key={num} className="rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline p-6"><span className="font-display font-bold text-3xl text-amber">{num}</span><h3 className="font-display text-lg mt-3">{title}</h3><p className="mt-2 text-sm text-muted dark:text-white/55 leading-relaxed">{body}</p></article>)}
        </div>
      </section>

      {/* Showcase (real validated case data) */}
      {data && <Showcase data={data} />}

      {/* Trust */}
      <section id="trust" className="pt-24">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
          <article className="rounded-2xl bg-forest text-white p-8"><p className="eyebrow text-lime">Trust boundary</p><h2 className="font-display text-3xl font-bold mt-2 mb-4">Built to be audited.</h2><p className="text-white/75 leading-relaxed">Approved evidence is rendered separately from pending or rejected candidates. Runs are traced; the frozen replay works offline with no provider key.</p></article>
          <article className="rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline p-8"><h3 className="font-display text-lg mb-3">Honest limitations</h3><ul className="space-y-2.5 text-sm text-muted dark:text-white/60">{["This retrospective uses a small approved evidence set.", "Scenario language is decision support, not a forecast or bankruptcy prediction.", "Northstar Home Retail is fictional — used only for scenario framing."].map((item) => <li key={item} className="flex gap-2.5"><svg className="w-4 h-4 mt-0.5 shrink-0 text-green2" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m20 6-11 11-5-5" /></svg>{item}</li>)}</ul></article>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-24 rounded-[28px] bg-lime text-ink p-10 sm:p-14 text-center">
        <h2 className="section-title font-bold">Investigate a signal now.</h2>
        <p className="mt-3 max-w-xl mx-auto text-ink/70">Open the evidence agent and get a cited answer with visual decision artifacts.</p>
        <Link to="/chat" className="mt-7 inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-forest text-white font-bold cursor-pointer hover:bg-green2 transition-colors">Open signalScout<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" /></svg></Link>
      </section>
    </main>

    <footer className="mx-auto max-w-shell px-5 grid sm:grid-cols-3 gap-8 py-14 text-muted dark:text-white/50 text-sm">
      <div><strong className="text-ink dark:text-white font-display">signalScout</strong><p className="mt-2">Evidence-led strategic decision support.</p></div>
      <div><strong className="text-ink dark:text-white">Northstar Home Retail is fictional.</strong><p className="mt-2">A comparison company used only for strategic scenario framing.</p></div>
      <div><strong className="text-ink dark:text-white">Methodology</strong><p className="mt-2">Bounded fit index, citation-linked evidence and temporal replay. Recommendations are a review posture, not a forecast.</p></div>
    </footer>
  </div>;
}

function Showcase({ data }: { data: CasePackage }) {
  const [frameIndex, setFrameIndex] = useState(data.replay.length - 1);
  const frame = data.replay[frameIndex];
  const timeline = useMemo(() => timelineViz(data, frame), [data, frame]);
  return <section id="showcase" className="pt-24">
    <div className="max-w-[760px] mb-9"><p className="eyebrow text-green2">Answers you can defend</p><h2 className="section-title font-bold mt-2.5">A preview of the visual artifacts.</h2><p className="mt-3 text-muted dark:text-white/55">The same blocks the evidence agent renders in chat — sourced from the validated offline case, {data.company.name}.</p></div>
    <div className="grid lg:grid-cols-[.9fr_1.4fr] gap-4 items-start mb-4">
      <PostureCard block={postureViz(data)} />
      <div className="rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline p-6"><StrategyFit block={strategyFitViz(data)} /></div>
    </div>
    <div className="rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline p-6 mb-4"><MetricLens block={metricLensViz(data)} /></div>
    <div className="rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline p-6">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-5">
        <div><p className="eyebrow text-green2">Offline replay</p><h3 className="font-display text-2xl font-bold mt-1">What was knowable, when</h3></div>
        <label className="min-w-[190px] text-muted dark:text-white/50 text-xs font-bold uppercase tracking-wide">As-of frame
          <select aria-label="As-of date" value={frameIndex} onChange={(event) => setFrameIndex(Number(event.target.value))} className="w-full mt-2 px-3 py-2.5 rounded-lg bg-canvas dark:bg-dcanvas border border-line dark:border-dline text-ink dark:text-white font-medium normal-case cursor-pointer">
            {data.replay.map((item, index) => <option key={item.asOf} value={index}>{formatDate(item.asOf)}</option>)}
          </select>
        </label>
      </div>
      <EvidenceTimeline block={timeline} />
    </div>
  </section>;
}

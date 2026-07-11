import type { CasePackage } from "@corpwatch/backend/contracts";

export function StrategyFitChart({ data, visibleEvidence, blocked }: { data: CasePackage; visibleEvidence: Set<string>; blocked: boolean }) {
  const scores = data.scenarios.map((scenario) => {
    const evidenceRatio = scenario.evidenceIds.filter((id) => visibleEvidence.has(id)).length / scenario.evidenceIds.length;
    const readiness = blocked ? 0 : 35; const evidence = Math.round(evidenceRatio * 30); const alignment = scenario.posture === data.recommendation.posture ? 25 : 5; const structure = 10;
    return { scenario, score: readiness + evidence + alignment + structure };
  });
  const recommended = scores.find((item) => item.scenario.posture === data.recommendation.posture)!;
  const cellRow = "flex justify-between gap-3 py-2.5 border-t border-line dark:border-dline";
  const dt = "text-muted dark:text-white/45 text-xs uppercase"; const dd = "font-bold text-sm";

  return <section id="strategy" className="pt-24 border-b border-line dark:border-dline" aria-labelledby="strategy-title">
    <div className="flex flex-wrap justify-between items-end gap-8 mb-9">
      <div className="max-w-[760px]"><p className="eyebrow text-green2">Strategy fit</p><h2 id="strategy-title" className="section-title font-bold mt-2.5">Compare response posture</h2><p className="mt-3 text-muted dark:text-white/55">A deterministic review index based on section readiness, visible evidence coverage and recommendation alignment-not a forecast probability.</p></div>
      <div className="grid place-content-center text-center w-32 h-32 rounded-full fit-ring shrink-0" style={{ "--fit": `${recommended.score * 3.6}deg` } as React.CSSProperties}>
        <div className="grid place-content-center w-[104px] h-[104px] rounded-full bg-canvas dark:bg-dcanvas mx-auto"><strong className="font-display text-3xl">{recommended.score}</strong><span className="text-muted dark:text-white/45 text-[.68rem] uppercase">{recommended.scenario.posture} fit</span></div>
      </div>
    </div>
    {blocked && <div className="mb-4 p-4 rounded-lg bg-[#fff1dc] text-ink border-l-4 border-amber"><strong>Fit index blocked</strong><p className="mt-1 text-sm">Required metric coverage is incomplete; scenario scores remain provisional.</p></div>}
    <div className="grid md:grid-cols-3 gap-4">{scores.map(({ scenario, score }) => {
      const selected = scenario.posture === data.recommendation.posture;
      return <article key={scenario.posture} className={`rounded-2xl bg-paper dark:bg-dsurface p-6 relative overflow-hidden cursor-pointer ${selected ? "border border-green2 shadow-brand" : "border border-line dark:border-dline hover:shadow-panel transition-shadow"}`}>
        {selected && <span className="absolute inset-x-0 top-0 h-1 bg-green2" />}
        <div className="flex justify-between items-start gap-3">
          <div><span className="inline-flex px-2 py-1 rounded-md bg-[#e3eee9] text-green2 text-[.62rem] font-extrabold uppercase tracking-wide">{scenario.posture}</span><h3 className="font-display text-lg mt-2">{scenario.headline}</h3></div>
          <strong className={`font-display text-3xl ${selected ? "text-green2" : "text-muted dark:text-white/40"}`}>{score}<small className="text-muted text-[.7rem] font-normal">/100</small></strong>
        </div>
        <div className="h-2 my-5 rounded-full bg-soft dark:bg-dsurface2 overflow-hidden" aria-label={`${scenario.posture} strategy fit ${score} out of 100`}><i className="block h-full rounded-full bg-gradient-to-r from-green2 to-[#80af52]" style={{ width: `${score}%` }} /></div>
        <p className="min-h-[64px] text-sm text-muted dark:text-white/55">{scenario.impact}</p>
        <dl className="mt-1">
          <div className={cellRow}><dt className={dt}>Benefit</dt><dd className={dd}>{scenario.benefit}</dd></div>
          <div className={cellRow}><dt className={dt}>Risk</dt><dd className={dd}>{scenario.risk}</dd></div>
          <div className={cellRow}><dt className={dt}>Cost</dt><dd className={dd}>{scenario.cost}</dd></div>
        </dl>
      </article>;
    })}</div>
    <p className="mt-5 text-muted dark:text-white/50 text-sm"><strong className="text-ink dark:text-white">Index formula:</strong> readiness 35 + visible evidence 30 + recommendation alignment 25 + structured impact framing 10.</p>
  </section>;
}

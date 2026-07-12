import type { StrategyFitViz } from "@corpwatch/backend/contracts";

export function StrategyFit({ block }: { block: StrategyFitViz }) {
  const recommended = block.scenarios.find((scenario) => scenario.posture === block.recommended) ?? block.scenarios[0];
  return <section aria-label="Strategy fit">
    <div className="flex flex-wrap justify-between items-end gap-6 mb-6">
      <div><p className="eyebrow text-green2">Strategy fit</p><h3 className="font-display text-2xl font-bold mt-1">Compare response posture</h3></div>
      <div className="grid place-content-center text-center w-28 h-28 rounded-full fit-ring shrink-0" style={{ "--fit": `${recommended.score * 3.6}deg` } as React.CSSProperties}>
        <div className="grid place-content-center w-[92px] h-[92px] rounded-full bg-paper dark:bg-dsurface mx-auto"><strong className="font-display text-2xl">{recommended.score}</strong><span className="text-muted dark:text-white/45 text-[.6rem] uppercase">{recommended.posture} fit</span></div>
      </div>
    </div>
    <div className="grid sm:grid-cols-3 gap-3">{block.scenarios.map((scenario) => {
      const selected = scenario.posture === block.recommended;
      return <article key={scenario.posture} className={`rounded-2xl bg-paper dark:bg-dsurface p-5 relative overflow-hidden ${selected ? "border border-green2 shadow-brand" : "border border-line dark:border-dline"}`}>
        {selected && <span className="absolute inset-x-0 top-0 h-1 bg-green2" />}
        <div className="flex justify-between items-start gap-2">
          <div><span className="inline-flex px-2 py-1 rounded-md bg-[#e3eee9] text-green2 text-[.6rem] font-extrabold uppercase tracking-wide">{scenario.posture}</span><h4 className="font-display text-base mt-2">{scenario.headline}</h4></div>
          <strong className={`font-display text-2xl ${selected ? "text-green2" : "text-muted dark:text-white/40"}`}>{scenario.score}</strong>
        </div>
        <div className="h-2 my-4 rounded-full bg-soft dark:bg-dsurface2 overflow-hidden" aria-label={`${scenario.posture} strategy fit ${scenario.score} out of 100`}><i className="block h-full rounded-full bg-gradient-to-r from-green2 to-[#80af52]" style={{ width: `${scenario.score}%` }} /></div>
        <p className="min-h-[54px] text-sm text-muted dark:text-white/55">{scenario.impact}</p>
        <dl className="mt-1 text-sm">
          <div className="flex justify-between gap-3 py-2 border-t border-line dark:border-dline"><dt className="text-muted dark:text-white/45 text-xs uppercase">Cost</dt><dd className="font-bold">{scenario.cost}</dd></div>
          <div className="flex justify-between gap-3 py-2 border-t border-line dark:border-dline"><dt className="text-muted dark:text-white/45 text-xs uppercase">Benefit</dt><dd className="font-bold">{scenario.benefit}</dd></div>
          <div className="flex justify-between gap-3 py-2 border-t border-line dark:border-dline"><dt className="text-muted dark:text-white/45 text-xs uppercase">Risk</dt><dd className="font-bold">{scenario.risk}</dd></div>
        </dl>
      </article>;
    })}</div>
  </section>;
}

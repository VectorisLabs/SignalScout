import type { CasePackage } from "@corpwatch/backend/contracts";

export function StrategyFitChart({ data, visibleEvidence, blocked }: { data: CasePackage; visibleEvidence: Set<string>; blocked: boolean }) {
  const scores = data.scenarios.map((scenario) => {
    const evidenceRatio = scenario.evidenceIds.filter((id) => visibleEvidence.has(id)).length / scenario.evidenceIds.length;
    const readiness = blocked ? 0 : 35; const evidence = Math.round(evidenceRatio * 30); const alignment = scenario.posture === data.recommendation.posture ? 25 : 5; const structure = 10;
    return { scenario, score: readiness + evidence + alignment + structure };
  });
  const recommended = scores.find((item) => item.scenario.posture === data.recommendation.posture)!;
  return <section id="strategy" className="section-block strategy-section" aria-labelledby="strategy-title"><div className="section-heading"><div><p className="eyebrow">Strategy fit</p><h2 id="strategy-title">Compare response posture</h2><p>A deterministic review index based on section readiness, visible evidence coverage and recommendation alignment—not a forecast probability.</p></div><div className="fit-ring" style={{ "--fit": `${recommended.score * 3.6}deg` } as React.CSSProperties}><strong>{recommended.score}</strong><span>{recommended.scenario.posture} fit</span></div></div>
    {blocked && <div className="notice compact"><strong>Fit index blocked</strong><p>Required metric coverage is incomplete; scenario scores remain provisional.</p></div>}
    <div className="strategy-chart">{scores.map(({ scenario, score }) => <article key={scenario.posture} className={scenario.posture === data.recommendation.posture ? "selected" : ""}><div className="strategy-label"><div><span className="tag">{scenario.posture}</span><h3>{scenario.headline}</h3></div><strong>{score}<small>/100</small></strong></div><div className="fit-track" aria-label={`${scenario.posture} strategy fit ${score} out of 100`}><i style={{ width: `${score}%` }} /></div><p>{scenario.impact}</p><dl><div><dt>Benefit</dt><dd>{scenario.benefit}</dd></div><div><dt>Risk</dt><dd>{scenario.risk}</dd></div><div><dt>Cost</dt><dd>{scenario.cost}</dd></div></dl></article>)}</div>
    <p className="formula-note"><strong>Index formula:</strong> readiness 35 + visible evidence 30 + recommendation alignment 25 + structured impact framing 10.</p>
  </section>;
}

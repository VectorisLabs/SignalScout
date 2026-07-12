import type { ChatVisualization } from "@corpwatch/backend/contracts";
import { PostureCard } from "./blocks/PostureCard";
import { StrategyFit } from "./blocks/StrategyFit";
import { EvidenceTimeline } from "./blocks/EvidenceTimeline";
import { PatternRadar } from "./blocks/PatternRadar";
import { MetricLens } from "./blocks/MetricLens";
import { OperationsCharts } from "./blocks/OperationsCharts";

function renderBlock(block: ChatVisualization) {
  switch (block.kind) {
    case "posture": return <PostureCard block={block} />;
    case "strategyFit": return <StrategyFit block={block} />;
    case "evidenceTimeline": return <EvidenceTimeline block={block} />;
    case "patternRadar": return <PatternRadar block={block} />;
    case "metricLens": return <MetricLens block={block} />;
    case "operations": return <OperationsCharts block={block} />;
  }
}

export function ArtifactRenderer({ blocks }: { blocks: ChatVisualization[] }) {
  return <div className="space-y-8">{blocks.map((block, index) => <div key={`${block.kind}-${index}`}>{renderBlock(block)}</div>)}</div>;
}

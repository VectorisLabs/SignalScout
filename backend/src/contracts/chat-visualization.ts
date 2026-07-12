import { z } from "zod";

/**
 * Structured visualization blocks attached to a chat answer. The frontend chat
 * workspace renders each block as an "artifact" in the right-hand panel.
 * Every block mirrors an existing dashboard component's props so the renderers
 * can reuse those components directly.
 */
export const VizPostureEnum = z.enum(["MAINTAIN", "ADAPT", "ACCELERATE"]);

export const PostureVizSchema = z.object({
  kind: z.literal("posture"),
  posture: VizPostureEnum,
  index: z.number().min(0).max(100),
  stage: z.string(),
  rationale: z.string(),
  evidenceIds: z.array(z.string()).default([]),
});

export const StrategyFitVizSchema = z.object({
  kind: z.literal("strategyFit"),
  recommended: VizPostureEnum,
  scenarios: z.array(z.object({
    posture: VizPostureEnum,
    headline: z.string(),
    score: z.number().min(0).max(100),
    cost: z.string(),
    benefit: z.string(),
    risk: z.string(),
    impact: z.string(),
  })).min(1),
});

export const EvidenceTimelineVizSchema = z.object({
  kind: z.literal("evidenceTimeline"),
  asOf: z.string().nullable().default(null),
  items: z.array(z.object({
    id: z.string(),
    title: z.string(),
    excerpt: z.string(),
    date: z.string(),
    sourceUrl: z.string().nullable().default(null),
    status: z.string().default("Approved"),
  })),
});

export const PatternRadarVizSchema = z.object({
  kind: z.literal("patternRadar"),
  claims: z.array(z.object({
    id: z.string(),
    text: z.string(),
    evidenceIds: z.array(z.string()),
  })),
});

export const MetricLensVizSchema = z.object({
  kind: z.literal("metricLens"),
  coverage: z.number().min(0).max(100),
  metrics: z.array(z.object({
    label: z.string(),
    value: z.number().finite(),
    unit: z.string(),
    period: z.string(),
    quality: z.string(),
    evidenceId: z.string(),
  })),
});

export const OperationsVizSchema = z.object({
  kind: z.literal("operations"),
  summary: z.object({
    totalRuns: z.number(),
    validationPassRate: z.number(),
    averageLatencyMs: z.number(),
    candidates: z.number(),
    approved: z.number(),
  }),
  providerDistribution: z.array(z.object({ provider: z.string(), count: z.number() })),
  validationTrend: z.array(z.object({ at: z.string(), passRate: z.number(), latencyMs: z.number() })),
});

export const ChatVisualizationSchema = z.discriminatedUnion("kind", [
  PostureVizSchema,
  StrategyFitVizSchema,
  EvidenceTimelineVizSchema,
  PatternRadarVizSchema,
  MetricLensVizSchema,
  OperationsVizSchema,
]);

export type ChatVisualization = z.infer<typeof ChatVisualizationSchema>;
export type ChatVisualizationKind = ChatVisualization["kind"];
export type PostureViz = z.infer<typeof PostureVizSchema>;
export type StrategyFitViz = z.infer<typeof StrategyFitVizSchema>;
export type EvidenceTimelineViz = z.infer<typeof EvidenceTimelineVizSchema>;
export type PatternRadarViz = z.infer<typeof PatternRadarVizSchema>;
export type MetricLensViz = z.infer<typeof MetricLensVizSchema>;
export type OperationsViz = z.infer<typeof OperationsVizSchema>;

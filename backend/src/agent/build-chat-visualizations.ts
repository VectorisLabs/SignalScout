import { buildCase } from "../../scripts/build-case";
import type { CasePackage } from "../contracts";
import type { ChatVisualization } from "../contracts";
import type { ToolEvent } from "./audit-store";
import { getMetrics } from "./audit-store";

/** Deterministic validated offline bundle — the single approved source of truth. */
const casePackage: CasePackage = buildCase();

const metricLabels: Record<string, string> = {
  revenue: "Revenue / net sales", gross_profit: "Gross profit", operating_income: "Operating income",
  sga: "SG&A", restructuring_cost: "Restructuring cost", cash_and_equivalents: "Cash & equivalents",
  operating_cash_flow: "Operating cash flow", capital_expenditure: "Capital expenditure", inventory: "Inventory",
  accounts_payable: "Accounts payable", short_term_debt: "Short-term debt", long_term_debt: "Long-term debt",
  store_count: "Store count", employee_count: "Employee count",
};

/** Mirrors the frontend StrategyFitChart formula, evaluated with all approved evidence visible. */
function fitScore(scenario: CasePackage["scenarios"][number]): number {
  const readiness = 35;
  const evidence = 30; // all approved evidence is visible in the answer context
  const alignment = scenario.posture === casePackage.recommendation.posture ? 25 : 5;
  const structure = 10;
  return readiness + evidence + alignment + structure;
}

function postureBlock(): ChatVisualization {
  const outcome = casePackage.replay[casePackage.replay.length - 1];
  return {
    kind: "posture",
    posture: casePackage.recommendation.posture,
    index: Math.round(outcome.score * 100),
    stage: outcome.stage,
    rationale: casePackage.recommendation.rationale,
    evidenceIds: casePackage.recommendation.evidenceIds,
  };
}

function strategyFitBlock(): ChatVisualization {
  return {
    kind: "strategyFit",
    recommended: casePackage.recommendation.posture,
    scenarios: casePackage.scenarios.map((scenario) => ({
      posture: scenario.posture, headline: scenario.headline, score: fitScore(scenario),
      cost: scenario.cost, benefit: scenario.benefit, risk: scenario.risk, impact: scenario.impact,
    })),
  };
}

function evidenceTimelineBlock(): ChatVisualization {
  return {
    kind: "evidenceTimeline",
    asOf: casePackage.replay[casePackage.replay.length - 1].asOf,
    items: casePackage.evidence.map((item) => ({
      id: item.id, title: item.title, excerpt: item.excerpt, date: item.publiclyAvailableAt,
      sourceUrl: casePackage.sources.find((source) => source.id === item.sourceId)?.url ?? null,
      status: "Approved",
    })),
  };
}

function patternRadarBlock(): ChatVisualization {
  return { kind: "patternRadar", claims: casePackage.claims.map((claim) => ({ id: claim.id, text: claim.text, evidenceIds: claim.evidenceIds })) };
}

function metricLensBlock(): ChatVisualization {
  const coverage = Math.min(100, Math.round((new Set(casePackage.metrics.map((metric) => metric.metricKey)).size / 14) * 100));
  return {
    kind: "metricLens",
    coverage,
    metrics: casePackage.metrics.map((metric) => ({
      label: metricLabels[metric.metricKey] ?? metric.metricKey, value: metric.value, unit: metric.unit,
      period: metric.period, quality: metric.quality, evidenceId: metric.evidenceId,
    })),
  };
}

function operationsBlock(): ChatVisualization {
  const metrics = getMetrics();
  return {
    kind: "operations",
    summary: {
      totalRuns: metrics.summary.totalRuns, validationPassRate: metrics.summary.validationPassRate,
      averageLatencyMs: metrics.summary.averageLatencyMs, candidates: metrics.summary.candidates, approved: metrics.summary.approved,
    },
    providerDistribution: metrics.providerDistribution,
    validationTrend: metrics.validationTrend,
  };
}

const has = (message: string, terms: string[]) => terms.some((term) => message.includes(term));

interface Citation { id: string; title: string; url: string; status: string }
export interface VizContext { live: boolean; citations?: Citation[] }

/** Real approved citations from a live answer, rendered as an evidence timeline (no case-package data). */
function citationsTimelineBlock(citations: Citation[]): ChatVisualization {
  return { kind: "evidenceTimeline", asOf: null, items: citations.map((citation) => ({ id: citation.id, title: citation.title, excerpt: "", date: "", sourceUrl: citation.url || null, status: citation.status === "VALID_CANDIDATE" ? "Approved" : citation.status })) };
}

/** Whether the question is about the validated offline demo case (Bed Bath & Beyond / Northstar). */
function isDemoCase(text: string): boolean { return /bed bath|bbby|northstar|home retail/.test(text); }

/**
 * Select the visualization blocks that accompany an answer. Analytic blocks
 * (posture, strategy fit, metric lens, pattern radar) are backed by the validated
 * offline bundle and are only surfaced for the demo case or the offline demo path —
 * never grafted onto an unrelated live company. Live approved citations are always
 * rendered as a real evidence timeline. Approved evidence only.
 */
export function buildChatVisualizations(message: string, context: VizContext = { live: false }): ChatVisualization[] {
  const text = message.toLowerCase();
  const blocks: ChatVisualization[] = [];

  const liveTimeline = context.citations && context.citations.length > 0 ? citationsTimelineBlock(context.citations) : null;
  if (liveTimeline) blocks.push(liveTimeline);

  // Case-package analytics apply only to the demo company (offline bundle) — or the key-free demo path.
  if (!context.live || isDemoCase(text)) {
    const wantsMetrics = has(text, ["metric", "revenue", "cash", "coverage", "financ", "liquid", "debt", "sales", "profit"]);
    const wantsEvidence = has(text, ["evidence", "restructur", "filing", "disclos", "source", "citation", "timeline", "knowable"]);
    const wantsStrategy = has(text, ["posture", "recommend", "respond", "strategy", "scenario", "maintain", "adapt", "accelerate", "decision"]);
    const wantsOps = has(text, ["route", "operation", "latency", "provider", "collector", "validation rate", "audit"]);

    if (wantsStrategy) blocks.push(postureBlock(), strategyFitBlock());
    if (wantsMetrics) blocks.push(metricLensBlock());
    if (wantsEvidence) { if (!liveTimeline) blocks.push(evidenceTimelineBlock()); blocks.push(patternRadarBlock()); }
    if (wantsOps) blocks.push(operationsBlock());

    // Never leave the demo/offline panel empty.
    if (blocks.length === 0) blocks.push(postureBlock(), evidenceTimelineBlock());
  }
  return blocks;
}

export interface OfflineChatTurn {
  answer: string;
  citations: Array<{ id: string; title: string; url: string; status: string }>;
  toolEvents: ToolEvent[];
  visualizations: ChatVisualization[];
}

/**
 * Deterministic, key-free chat turn used when OpenAI is not configured. The prose
 * is sourced from the validated offline bundle and framed as a retrospective
 * replay — no invention, approved evidence only.
 */
export function buildOfflineChatTurn(message: string): OfflineChatTurn {
  const now = new Date().toISOString();
  const firstDate = casePackage.evidence[0]?.publiclyAvailableAt.slice(0, 10);
  const lastDate = casePackage.evidence[casePackage.evidence.length - 1]?.publiclyAvailableAt.slice(0, 10);
  const answer = `Offline evidence replay for ${casePackage.company.name} (${casePackage.company.ticker}). `
    + `Recommended posture: ${casePackage.recommendation.posture}. ${casePackage.recommendation.rationale} `
    + `This draws on ${casePackage.evidence.length} approved public disclosures spanning ${firstDate} to ${lastDate}. `
    + `It is a retrospective replay of the validated offline bundle — decision support, not a forecast. `
    + `Configure OPENAI_API_KEY to ask live investigative questions.`;
  const citations = casePackage.evidence.map((item) => ({
    id: item.id, title: item.title, status: "VALID_CANDIDATE",
    url: casePackage.sources.find((source) => source.id === item.sourceId)?.url ?? "",
  }));
  const toolEvents: ToolEvent[] = [
    { at: now, phase: "routing", status: "completed", message: "Offline replay: no live collector route required." },
    { at: now, phase: "validating", status: "completed", message: `Evidence Gate approved ${citations.length} public disclosures from the frozen bundle.` },
    { at: now, phase: "answering", status: "completed", message: "Answer and visualizations composed from the validated offline case package." },
  ];
  return { answer, citations, toolEvents, visualizations: buildChatVisualizations(message) };
}

import type { CollectorRoute } from "./contracts";

export interface ToolEvent { at: string; phase: "routing" | "collecting" | "validating" | "answering"; status: "started" | "completed" | "failed" | "planned"; message: string }
export interface RunRecord {
  id: string; sessionId: string; startedAt: string; completedAt: string; status: "SUCCESS" | "FAILED" | "CONFIG_REQUIRED";
  provider: CollectorRoute | "NONE"; routingReason: string; latencyMs: number; candidates: number; approved: number;
  validationPassRate: number; inputTokens: number | null; outputTokens: number | null; model: string | null;
  traceId: string; traceUrl?: string | null; promptVersion?: number; promptSource?: string; errorCategory: string | null; toolEvents: ToolEvent[];
}

const runs: RunRecord[] = [];
export function recordRun(run: RunRecord) { runs.unshift(run); if (runs.length > 100) runs.length = 100; }
export function getMetrics() {
  const completed = runs.filter((run) => run.status === "SUCCESS");
  const byProvider = Object.entries(runs.reduce<Record<string, number>>((acc, run) => { acc[run.provider] = (acc[run.provider] ?? 0) + 1; return acc; }, {})).map(([provider, count]) => ({ provider, count }));
  const avg = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return {
    summary: {
      totalRuns: runs.length, successfulRuns: completed.length, failedRuns: runs.length - completed.length,
      toolCalls: runs.filter((run) => run.provider !== "NONE").length,
      candidates: runs.reduce((sum, run) => sum + run.candidates, 0), approved: runs.reduce((sum, run) => sum + run.approved, 0),
      validationPassRate: avg(runs.map((run) => run.validationPassRate)), averageLatencyMs: avg(runs.map((run) => run.latencyMs)),
      inputTokens: runs.reduce((sum, run) => sum + (run.inputTokens ?? 0), 0), outputTokens: runs.reduce((sum, run) => sum + (run.outputTokens ?? 0), 0),
    },
    providerDistribution: byProvider,
    validationTrend: [...runs].reverse().map((run) => ({ at: run.completedAt, passRate: run.validationPassRate, latencyMs: run.latencyMs })),
    recentRuns: runs.slice(0, 20),
  };
}

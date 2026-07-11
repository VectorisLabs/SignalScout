import { LangfuseClient } from "@langfuse/client";
import { startObservation } from "@langfuse/tracing";
import type { GateResult } from "./contracts";
import type { CrawlOutputValidation } from "./crawl-output";

const configured = Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);
const client = configured ? new LangfuseClient() : null;

export interface ManagedPrompt { content: string; name: string; version: number; isFallback: boolean; label: string }

export async function getAgentPrompt(fallback: string): Promise<ManagedPrompt> {
  if (!client) return { content: fallback, name: "corpwatch/chat-agent", version: 0, isFallback: true, label: "local-fallback" };
  try {
    const prompt = await client.prompt.get("corpwatch/chat-agent", { type: "text", label: "production", fallback, cacheTtlSeconds: 60, fetchTimeoutMs: 1500, maxRetries: 1 });
    return { content: prompt.compile(), name: prompt.name, version: prompt.version, isFallback: prompt.isFallback, label: prompt.isFallback ? "local-fallback" : "production" };
  } catch {
    return { content: fallback, name: "corpwatch/chat-agent", version: 0, isFallback: true, label: "local-fallback" };
  }
}

export function startChatTrace(sessionId: string, input: string) {
  const observation = startObservation("corpwatch-chat-turn", { input: { message: input.slice(0, 500) }, metadata: { component: "openai-chat-agent", policy: "COLLECTOR-ROUTER-v1" } }, { asType: "agent" });
  observation.update({ metadata: { component: "openai-chat-agent", policy: "COLLECTOR-ROUTER-v1", sessionId, tags: ["corpwatch", "chat-agent"] } });
  return observation;
}

export function recordGateScores(traceId: string, results: GateResult[], observationId?: string) {
  if (!client || !results.length) return;
  const checks = ["schema_valid", "public_url_valid", "replay_time_valid", "content_present", "rights_eligible"];
  for (const name of checks) {
    const relevant = results.flatMap((result) => result.checks).filter((item) => item.name === name);
    const value = relevant.length && relevant.every((item) => item.passed) ? 1 : 0;
    client.score.create({ traceId, observationId, name: `candidate_${name}`, value, dataType: "BOOLEAN", comment: "Deterministic CorpWatch Evidence Gate check" });
  }
  client.score.create({ traceId, observationId, name: "candidate_gate_passed", value: results.every((result) => result.status === "VALID_CANDIDATE") ? 1 : 0, dataType: "BOOLEAN", comment: "Requires deterministic checks and curator approval" });
}

export function recordCrawlOutputScores(traceId: string, result: CrawlOutputValidation, observationId: string, attempt: number) {
  if (!client) return;
  client.score.create({ traceId, observationId, name: "crawl_output_schema_valid", value: result.passed ? 1 : 0, dataType: "BOOLEAN", comment: `CRAWL-OUTPUT-v1 deterministic schema/public-URL/content validation; attempt ${attempt}` });
  client.score.create({ traceId, observationId, name: "crawl_clean_record_ratio", value: result.recordCount ? result.data.length / result.recordCount : 0, dataType: "NUMERIC", comment: `Clean records divided by collector records; attempt ${attempt}` });
}

export function recordTraceScore(traceId: string, name: string, value: number, comment: string) { if (client) client.score.create({ traceId, name, value, dataType: "NUMERIC", comment }); }
export async function getTraceUrl(traceId: string) { if (!client) return null; try { return await client.getTraceUrl(traceId); } catch { return null; } }

export async function flushLangfuse() { if (client) await client.flush(); }
export function isLangfuseConfigured() { return configured; }

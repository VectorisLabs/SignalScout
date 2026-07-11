import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { ChatRequestSchema } from "./agent/contracts";
import { getMetrics, recordRun, type RunRecord } from "./agent/audit-store";
import { runChatAgent } from "./agent/openai-agent";
import { flushLangfuse, isLangfuseConfigured } from "./agent/langfuse-runtime";

const port = Number(process.env.BACKEND_PORT ?? 8787);
const server = createServer(async (request, response) => {
  setHeaders(response);
  if (request.method === "OPTIONS") return end(response, 204, null);
  if (request.method === "GET" && request.url === "/api/health") return json(response, 200, health());
  if (request.method === "GET" && request.url === "/api/metrics") return json(response, 200, getMetrics());
  if (request.method === "POST" && request.url === "/api/chat") return handleChat(request, response);
  return json(response, 404, { error: "NOT_FOUND" });
});

async function handleChat(request: IncomingMessage, response: ServerResponse) {
  const started = Date.now(); const id = randomUUID(); const startedAt = new Date().toISOString();
  try {
    const input = ChatRequestSchema.parse(await readJson(request));
    const result = await runChatAgent(input);
    recordRun({ id, sessionId: input.sessionId, startedAt, completedAt: new Date().toISOString(), status: "SUCCESS", provider: result.provider, routingReason: result.routingReason, latencyMs: Date.now() - started, candidates: result.candidates, approved: result.approved, validationPassRate: result.validationPassRate, inputTokens: result.inputTokens, outputTokens: result.outputTokens, model: result.model, traceId: result.traceId, traceUrl: result.traceUrl, promptVersion: result.promptVersion, promptSource: result.promptSource, errorCategory: null, toolEvents: result.toolEvents });
    return json(response, 200, { answer: result.answer, citations: result.citations, run: { id, traceId: result.traceId, traceUrl: result.traceUrl, provider: result.provider, routingReason: result.routingReason, promptVersion: result.promptVersion, promptSource: result.promptSource }, toolEvents: result.toolEvents });
  } catch (error) {
    const configuration = error instanceof Error && error.message === "OPENAI_CONFIGURATION_REQUIRED";
    const providerError = classifyProviderError(error);
    const record: RunRecord = { id, sessionId: "unknown", startedAt, completedAt: new Date().toISOString(), status: configuration ? "CONFIG_REQUIRED" : "FAILED", provider: "NONE", routingReason: "Request did not reach a collector", latencyMs: Date.now() - started, candidates: 0, approved: 0, validationPassRate: 0, inputTokens: null, outputTokens: null, model: process.env.OPENAI_MODEL ?? null, traceId: id.replaceAll("-", "").slice(0, 32), errorCategory: configuration ? "CONFIG_REQUIRED" : providerError.category, toolEvents: [] };
    recordRun(record);
    return json(response, configuration ? 503 : providerError.httpStatus, { error: record.errorCategory, message: configuration ? "Set OPENAI_API_KEY and a valid OPENAI_MODEL ID in .env, then restart the backend." : providerError.message });
  }
}

function health() { return { status: "ok", openaiConfigured: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL), collectorsConfigured: { tinyfish: Boolean(process.env.TINYFISH_API_KEY), apify: Boolean(process.env.APIFY_TOKEN && process.env.APIFY_ACTOR_ID), mode: process.env.COLLECTOR_EXECUTION_MODE ?? "validate" }, langfuseConfigured: isLangfuseConfigured() }; }
function classifyProviderError(error: unknown) {
  const value = error as { status?: number; code?: string; error?: { code?: string; type?: string } };
  const code = value.code ?? value.error?.code;
  if (code === "model_not_found" || value.status === 404) return { category: "OPENAI_MODEL_NOT_FOUND", httpStatus: 503, message: "OPENAI_MODEL is invalid or unavailable to this API project. Use an accessible API model ID and restart the backend." };
  if (value.status === 401 || code === "invalid_api_key") return { category: "OPENAI_AUTH_FAILED", httpStatus: 503, message: "OpenAI authentication failed. Verify OPENAI_API_KEY and restart the backend." };
  if (value.status === 429) return { category: "OPENAI_RATE_LIMITED", httpStatus: 429, message: "OpenAI rate or quota limit was reached. Retry after the provider delay or check project quota." };
  if (typeof value.status === "number" && value.status >= 500) return { category: "OPENAI_UNAVAILABLE", httpStatus: 502, message: "OpenAI is temporarily unavailable. Retry later; the frozen replay remains available." };
  return { category: "REQUEST_FAILED", httpStatus: 400, message: "The chat request was rejected by schema, routing policy, or provider validation. Check the run log for its safe error category." };
}
async function readJson(request: IncomingMessage) { let body = ""; for await (const chunk of request) { body += chunk; if (body.length > 64_000) throw new Error("BODY_TOO_LARGE"); } return JSON.parse(body || "{}"); }
function setHeaders(response: ServerResponse) { response.setHeader("Content-Type", "application/json; charset=utf-8"); response.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5173"); response.setHeader("Access-Control-Allow-Headers", "Content-Type"); response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); }
function json(response: ServerResponse, status: number, value: unknown) { response.statusCode = status; response.end(JSON.stringify(value)); }
function end(response: ServerResponse, status: number, value: null) { response.statusCode = status; response.end(value); }

server.listen(port, "127.0.0.1", () => console.log(`CorpWatch backend listening on http://127.0.0.1:${port}`));
async function shutdown() { server.close(); await flushLangfuse(); process.exit(0); }
process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);

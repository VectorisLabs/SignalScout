import { config } from "dotenv";
import { resolve } from "node:path";
import { LangfuseClient } from "@langfuse/client";
import { fallbackInstructions } from "../src/agent/openai-agent";

config({ path: resolve(process.cwd(), "../.env"), quiet: true });

if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) throw new Error("LANGFUSE_CREDENTIALS_REQUIRED");

const client = new LangfuseClient();
const created = await client.prompt.create({
  name: "corpwatch/chat-agent",
  type: "text",
  prompt: fallbackInstructions,
  labels: ["production"],
  tags: ["corpwatch", "chat-agent"],
  config: { policyVersion: "COLLECTOR-ROUTER-v1", crawlOutputRubric: "CRAWL-OUTPUT-v1" },
  commitMessage: "Publish reviewed CorpWatch core-agent prompt with clean crawl-output handling",
});

const verified = await client.prompt.get("corpwatch/chat-agent", { type: "text", label: "production", cacheTtlSeconds: 0, fetchTimeoutMs: 5_000, maxRetries: 1 });
if (verified.compile() !== fallbackInstructions) throw new Error("LANGFUSE_PROMPT_CONTENT_MISMATCH");

console.log(JSON.stringify({ status: "PUBLISHED", name: verified.name, version: verified.version, labels: verified.labels, contentVerified: true, createdVersion: created.version }));

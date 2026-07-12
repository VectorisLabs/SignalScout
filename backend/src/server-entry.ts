import { config } from "dotenv";
import { createServer } from "node:http";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), "../.env"), quiet: true });
await import("./instrumentation");
const { handleRequest } = await import("./server");

const port = Number(process.env.BACKEND_PORT ?? 8787);
const server = createServer(handleRequest);
server.listen(port, "127.0.0.1", () => console.log(`CorpWatch backend listening on http://127.0.0.1:${port}`));

async function shutdown() {
  server.close();
  const { flushLangfuse } = await import("./agent/langfuse-runtime");
  await flushLangfuse();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

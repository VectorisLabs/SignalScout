import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeSDK } from "@opentelemetry/sdk-node";

const enabled = Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);
export const telemetrySdk = new NodeSDK({ spanProcessors: enabled ? [new LangfuseSpanProcessor()] : [] });
telemetrySdk.start();

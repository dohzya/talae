import { loadEnvConfigOrThrow } from "@talae/core";
import { DenoKvAdapter } from "./adapters/persistence/mod.ts";
import { OllamaAdapter, OpenAIAdapter } from "./adapters/llm/mod.ts";
import { createApp } from "./app.ts";

const config = loadEnvConfigOrThrow();

// Resolve database path relative to project root
const projectRoot = new URL("../../", import.meta.url).pathname;
const dbPath = config.DATABASE_PATH
  ? `${projectRoot}${config.DATABASE_PATH}`
  : undefined;

console.log("Starting TALAE backend...");
console.log(`Environment: ${config.NODE_ENV}`);
console.log(`LLM Provider: ${config.LLM_PROVIDER}`);
console.log(`Database: ${dbPath ?? "in-memory"}`);

const db = await DenoKvAdapter.create(dbPath);
console.log("✓ Database initialized");

const llm = config.LLM_PROVIDER === "openai"
  ? OpenAIAdapter.create(config.OPENAI_API_KEY!, config.OPENAI_MODEL!)
  : OllamaAdapter.create(config.OLLAMA_BASE_URL, config.OLLAMA_MODEL);
console.log(`✓ LLM adapter initialized (${config.LLM_PROVIDER})`);

const app = createApp({ db, llm });

const port = Number(Deno.env.get("PORT")) || 8000;
console.log(`\n🚀 Server running at http://localhost:${port}`);

Deno.serve({ port }, app.fetch);

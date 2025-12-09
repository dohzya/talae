import { z } from "@zod/zod/mini";

import { undefinable } from "../common/zod_utils.ts";

export const LLMProviders = ["ollama", "openai"] as const;
export type LLMProvider = "ollama" | "openai";

export type EnvConfig = {
  OLLAMA_BASE_URL: string;
  OLLAMA_CHAT_MODEL: string;
  LLM_PROVIDER: LLMProvider;
  OPENAI_API_KEY: string | undefined;
  OPENAI_CHAT_MODEL: string | undefined;
  DATABASE_PATH: string | undefined;
  NODE_ENV: "development" | "production" | "test";
};

export const EnvConfigSchema: z.ZodMiniType<EnvConfig> = z.object({
  OLLAMA_BASE_URL: z.url(),
  OLLAMA_CHAT_MODEL: z.string(),
  LLM_PROVIDER: z.enum(LLMProviders),
  OPENAI_API_KEY: undefinable(z.string()),
  OPENAI_CHAT_MODEL: undefinable(z.string()),
  DATABASE_PATH: undefinable(z.string()),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Load and validate environment configuration.
 * Returns validated config or ConfigError if validation fails.
 *
 * Defaults:
 * - OLLAMA_BASE_URL: "http://localhost:11434"
 * - OLLAMA_CHAT_MODEL: "ministral-3:8b"
 * - LLM_PROVIDER: "ollama"
 * - OPENAI_CHAT_MODEL: "gpt-5.1-nano"
 * - NODE_ENV: "development"
 */
export function loadEnvConfig(): EnvConfig | ConfigError {
  const raw = {
    OLLAMA_BASE_URL: Deno.env.get("OLLAMA_BASE_URL"),
    OLLAMA_CHAT_MODEL: Deno.env.get("OLLAMA_CHAT_MODEL"),
    LLM_PROVIDER: Deno.env.get("LLM_PROVIDER"),
    OPENAI_API_KEY: Deno.env.get("OPENAI_API_KEY"),
    OPENAI_CHAT_MODEL: Deno.env.get("OPENAI_CHAT_MODEL"),
    DATABASE_PATH: Deno.env.get("DATABASE_PATH"),
    NODE_ENV: Deno.env.get("NODE_ENV"),
  };

  // Apply defaults before parsing with the schema.
  const prepared = {
    OLLAMA_BASE_URL: raw["OLLAMA_BASE_URL"] ?? "http://localhost:11434",
    OLLAMA_CHAT_MODEL: raw["OLLAMA_CHAT_MODEL"] ?? "ministral-3:8b",
    LLM_PROVIDER: (raw["LLM_PROVIDER"] ?? "ollama") as LLMProvider,
    OPENAI_API_KEY: raw["OPENAI_API_KEY"] ?? undefined,
    OPENAI_CHAT_MODEL: raw["OPENAI_CHAT_MODEL"] ?? "gpt-5.1-nano",
    DATABASE_PATH: raw["DATABASE_PATH"] ?? undefined,
    NODE_ENV: (raw["NODE_ENV"] ?? "development") as EnvConfig["NODE_ENV"],
  };

  const parsed = EnvConfigSchema.safeParse(prepared as unknown);
  if (!parsed.success) {
    const msg = String(parsed.error);
    return new ConfigError(`Invalid environment configuration: ${msg}`);
  }

  // Cross-field validation: require OPENAI_API_KEY when provider is openai
  const cfg = parsed.data as EnvConfig;
  if (cfg.LLM_PROVIDER === "openai" && !cfg.OPENAI_API_KEY) {
    return new ConfigError(
      "OPENAI_API_KEY is required when LLM_PROVIDER is openai",
    );
  }

  return cfg;
}

/**
 * Load configuration or throw if invalid.
 * Use this when you want to fail fast at startup.
 */
export function loadEnvConfigOrThrow(): EnvConfig {
  const config = loadEnvConfig();
  if (config instanceof ConfigError) {
    throw config;
  }
  return config;
}

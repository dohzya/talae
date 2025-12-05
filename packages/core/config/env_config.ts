import { z } from "@zod/zod";

export const LLMProviderSchema = z.enum(["ollama", "openai"]);
export type LLMProvider = z.infer<typeof LLMProviderSchema>;

export const EnvConfigSchema = z.object({
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("ministral-3:8b"),
  LLM_PROVIDER: LLMProviderSchema.default("ollama"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional().default("gpt-4o-mini"),
  DATABASE_PATH: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default(
    "development",
  ),
});

export type EnvConfig = z.infer<typeof EnvConfigSchema>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Load and validate environment configuration.
 * Returns validated config or ConfigError if validation fails.
 */
export function loadEnvConfig(): EnvConfig | ConfigError {
  try {
    const raw = {
      OLLAMA_BASE_URL: Deno.env.get("OLLAMA_BASE_URL"),
      OLLAMA_MODEL: Deno.env.get("OLLAMA_MODEL"),
      LLM_PROVIDER: Deno.env.get("LLM_PROVIDER"),
      OPENAI_API_KEY: Deno.env.get("OPENAI_API_KEY"),
      OPENAI_MODEL: Deno.env.get("OPENAI_MODEL"),
      DATABASE_PATH: Deno.env.get("DATABASE_PATH"),
      NODE_ENV: Deno.env.get("NODE_ENV"),
    };

    const config = EnvConfigSchema.parse(raw);

    if (config.LLM_PROVIDER === "openai" && !config.OPENAI_API_KEY) {
      return new ConfigError(
        "OPENAI_API_KEY is required when LLM_PROVIDER is openai",
      );
    }

    return config;
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return new ConfigError(
        `Invalid environment configuration: ${issues.join(", ")}`,
      );
    }
    return new ConfigError(`Failed to load configuration: ${err}`);
  }
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

import type { LLMGenerateOptions, LLMMessage, LLMPort } from "@talae/core";

/**
 * OpenAI-compatible API client.
 * Works with OpenAI and any provider with compatible API.
 */

export interface OpenAIChatMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

export interface OpenAIChatRequest {
  readonly model: string;
  readonly messages: OpenAIChatMessage[];
  temperature?: number;
  max_tokens?: number;
  readonly stream?: boolean;
}

export interface OpenAIChatResponse {
  readonly choices: Array<{
    readonly message: {
      readonly content: string;
    };
  }>;
}

export interface OpenAIChatStreamChunk {
  readonly choices: Array<{
    readonly delta: {
      readonly content?: string;
    };
  }>;
}

export interface OpenAIEmbeddingRequest {
  readonly model: string;
  readonly input: string;
}

export interface OpenAIEmbeddingResponse {
  readonly data: Array<{
    readonly embedding: number[];
  }>;
}

export class OpenAIClientError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "OpenAIClientError";
  }
}

export class OpenAIAdapter implements LLMPort {
  readonly #apiKey: string;
  readonly #model: string;
  readonly #baseUrl: string;

  constructor(
    apiKey: string,
    model: string,
    baseUrl = "https://api.openai.com/v1",
  ) {
    this.#apiKey = apiKey;
    this.#model = model;
    this.#baseUrl = baseUrl;
  }

  async generate(
    messages: LLMMessage[],
    options?: LLMGenerateOptions,
  ): Promise<string> {
    const requestBody: OpenAIChatRequest = {
      model: this.#model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
      ...(options?.temperature !== undefined &&
        { temperature: options.temperature }),
      ...(options?.maxTokens !== undefined &&
        { max_tokens: options.maxTokens }),
    };
    const response = await fetch(`${this.#baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.#apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new OpenAIClientError(
        `OpenAI API error: ${response.statusText}`,
        response.status,
      );
    }

    const data = await response.json() as OpenAIChatResponse;
    return data.choices[0]?.message.content ?? "";
  }

  async *generateStream(
    messages: LLMMessage[],
    options?: LLMGenerateOptions,
  ): AsyncGenerator<string> {
    const requestBody: OpenAIChatRequest = {
      model: this.#model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
      ...(options?.temperature !== undefined &&
        { temperature: options.temperature }),
      ...(options?.maxTokens !== undefined &&
        { max_tokens: options.maxTokens }),
    };
    const response = await fetch(`${this.#baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.#apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new OpenAIClientError(
        `OpenAI API error: ${response.statusText}`,
        response.status,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new OpenAIClientError("No response body from OpenAI");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              return;
            }
            try {
              const chunk = JSON.parse(data) as OpenAIChatStreamChunk;
              const content = chunk.choices[0]?.delta.content;
              if (content) {
                yield content;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.#baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.#apiKey}`,
      },
      body: JSON.stringify(
        {
          model: this.#model,
          input: text,
        } satisfies OpenAIEmbeddingRequest,
      ),
    });

    if (!response.ok) {
      throw new OpenAIClientError(
        `OpenAI API error: ${response.statusText}`,
        response.status,
      );
    }

    const data = await response.json() as OpenAIEmbeddingResponse;
    const embedding = data.data[0]?.embedding;
    if (!embedding) {
      throw new OpenAIClientError("OpenAI returned no embedding");
    }
    return embedding;
  }

  static create(apiKey: string, model: string): OpenAIAdapter {
    return new OpenAIAdapter(apiKey, model);
  }
}

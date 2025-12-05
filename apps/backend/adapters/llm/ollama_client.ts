/**
 * Ollama HTTP client for interacting with local Ollama server.
 */

export interface OllamaGenerateRequest {
  readonly model: string;
  readonly prompt: string;
  readonly stream?: boolean;
  readonly options?: {
    readonly temperature?: number;
    readonly num_predict?: number;
  } | undefined;
}

export interface OllamaGenerateResponse {
  readonly model: string;
  readonly response: string;
  readonly done: boolean;
}

export class OllamaClientError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "OllamaClientError";
  }
}

export class OllamaClient {
  readonly #baseUrl: string;

  constructor(baseUrl: string) {
    this.#baseUrl = baseUrl;
  }

  async generate(
    request: OllamaGenerateRequest,
  ): Promise<OllamaGenerateResponse> {
    const response = await fetch(`${this.#baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!response.ok) {
      throw new OllamaClientError(
        `Ollama API error: ${response.statusText}`,
        response.status,
      );
    }

    return await response.json();
  }

  async *generateStream(
    request: OllamaGenerateRequest,
  ): AsyncGenerator<string> {
    const response = await fetch(`${this.#baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      throw new OllamaClientError(
        `Ollama API error: ${response.statusText}`,
        response.status,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new OllamaClientError("No response body from Ollama");
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
          if (line.trim()) {
            try {
              const data = JSON.parse(line) as OllamaGenerateResponse;
              if (data.response) {
                yield data.response;
              }
              if (data.done) {
                return;
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

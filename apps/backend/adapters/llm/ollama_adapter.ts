import type { LLMGenerateOptions, LLMMessage, LLMPort } from "@talae/core";
import { OllamaClient } from "./ollama_client.ts";

/**
 * Ollama adapter implementing LLMPort.
 * Converts generic LLM messages to Ollama prompt format.
 */
export class OllamaAdapter implements LLMPort {
  readonly #client: OllamaClient;
  readonly #model: string;

  constructor(client: OllamaClient, model: string) {
    this.#client = client;
    this.#model = model;
  }

  async generate(
    messages: LLMMessage[],
    options?: LLMGenerateOptions,
  ): Promise<string> {
    const prompt = this.#messagesToPrompt(messages);
    const requestOptions: { temperature?: number; num_predict?: number } = {};
    if (options?.temperature !== undefined) {
      requestOptions.temperature = options.temperature;
    }
    if (options?.maxTokens !== undefined) {
      requestOptions.num_predict = options.maxTokens;
    }
    const response = await this.#client.generate({
      model: this.#model,
      prompt,
      options: Object.keys(requestOptions).length > 0
        ? requestOptions
        : undefined,
    });
    return response.response;
  }

  async *generateStream(
    messages: LLMMessage[],
    options?: LLMGenerateOptions,
  ): AsyncGenerator<string> {
    const prompt = this.#messagesToPrompt(messages);
    const requestOptions: { temperature?: number; num_predict?: number } = {};
    if (options?.temperature !== undefined) {
      requestOptions.temperature = options.temperature;
    }
    if (options?.maxTokens !== undefined) {
      requestOptions.num_predict = options.maxTokens;
    }
    yield* this.#client.generateStream({
      model: this.#model,
      prompt,
      options: Object.keys(requestOptions).length > 0
        ? requestOptions
        : undefined,
    });
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.#client.embed({
      model: this.#model,
      prompt: text,
    });
    return response.embedding;
  }

  #messagesToPrompt(messages: LLMMessage[]): string {
    return messages
      .map((msg) => {
        const role = msg.role === "assistant"
          ? "Assistant"
          : msg.role === "system"
          ? "System"
          : "User";
        return `${role}: ${msg.content}`;
      })
      .join("\n\n");
  }

  static create(baseUrl: string, model: string): OllamaAdapter {
    const client = new OllamaClient(baseUrl);
    return new OllamaAdapter(client, model);
  }
}

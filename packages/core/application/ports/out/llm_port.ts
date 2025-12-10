/**
 * Generic LLM port for generating text.
 * Supports both complete responses and streaming.
 */

export interface LLMMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

export interface LLMGenerateOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly stream?: boolean;
}

export interface LLMPort {
  /**
   * Generate a complete response from messages.
   * Returns the full generated text.
   */
  generate(
    messages: LLMMessage[],
    options?: LLMGenerateOptions,
  ): Promise<string>;

  /**
   * Generate a streaming response from messages.
   * Yields text chunks as they arrive.
   */
  generateStream(
    messages: LLMMessage[],
    options?: LLMGenerateOptions,
  ): AsyncGenerator<string>;

  /**
   * Generate a vector embedding for semantic similarity operations.
   */
  embed(text: string): Promise<number[]>;
}

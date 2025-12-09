import type { DatabasePort, LLMPort } from "../ports/out/mod.ts";
import type { Character } from "../../domain/character.ts";
import type { Message } from "../../domain/message.ts";
import { MemoryRetrievalService } from "./memory_retrieval_service.ts";

/**
 * Service for generating character responses using LLM.
 * Creates contextual, first-person dialogue from character perspective.
 */
export class GenerateResponseService {
  readonly #db: DatabasePort;
  readonly #llm: LLMPort;
  readonly #memoryRetrieval: MemoryRetrievalService;

  constructor(
    db: DatabasePort,
    llm: LLMPort,
    memoryRetrieval = new MemoryRetrievalService(),
  ) {
    this.#db = db;
    this.#llm = llm;
    this.#memoryRetrieval = memoryRetrieval;
  }

  /**
   * Generate streaming character response to conversation.
   * Yields text chunks as they arrive.
   */
  async *generateResponse(
    characterId: string,
    conversationId: string,
  ): AsyncGenerator<string> {
    const character = await this.#db.get<Character>([
      "character",
      characterId,
    ]);

    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    const messages = await this.#db.list<Message>([
      "conversation",
      conversationId,
      "messages",
    ]);

    const sortedMessages = messages.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const systemPrompt = this.#buildSystemPrompt(
      character,
      this.#memoryRetrieval.findRelevantMemories(
        character.memories,
        sortedMessages.map((message) => message.content),
        { limit: 8 },
      ),
    );
    const conversationHistory = this.#buildConversationHistory(sortedMessages);

    const llmMessages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory,
    ];

    yield* this.#llm.generateStream(llmMessages, {
      temperature: 0.8,
      maxTokens: 500,
    });
  }

  #buildSystemPrompt(
    character: Character,
    relevantMemories: Character["memories"],
  ): string {
    const formattedMemories = relevantMemories
      .map((memory) => `- ${memory.content}`)
      .join("\n");

    return `You are ${character.name}.

Description: ${character.description}
Current State: ${character.currentState}

Your Memories:
${formattedMemories || "No significant memories yet."}

CRITICAL RULES:
1. Speak ONLY in first-person dialogue. No narration, no actions in *asterisks*.
2. Stay in character based on your description and memories.
3. Your responses should feel natural and conversational.
4. You don't have access to information beyond your memories and the conversation.
5. Keep responses concise and engaging (2-4 sentences typically).

Example of CORRECT response:
"I've been thinking about what you said yesterday. It really changed my perspective on things."

Example of INCORRECT response (DO NOT DO THIS):
"*smiles warmly* I've been thinking about what you said. *sits down* It changed my perspective."`;
  }

  #buildConversationHistory(
    messages: Message[],
  ): Array<{ role: "user" | "assistant"; content: string }> {
    return messages.map((msg) => ({
      role: msg.role === "user" ? "user" as const : "assistant" as const,
      content: msg.content,
    }));
  }
}

import type { DatabasePort, LLMPort } from "../ports/out/mod.ts";
import type { Universe, UniverseMemoryEntry } from "../../domain/universe.ts";

/**
 * Service for evolving universe state using LLM.
 * Simulates world changes based on universe memories and current state.
 */
export class EvolveWorldService {
  readonly #db: DatabasePort;
  readonly #llm: LLMPort;

  constructor(db: DatabasePort, llm: LLMPort) {
    this.#db = db;
    this.#llm = llm;
  }

  /**
   * Evolve universe state based on elapsed time and memories.
   * Returns new state or error.
   */
  async evolveUniverse(universeId: string): Promise<string | Error> {
    try {
      const universe = await this.#db.get<Universe>(["universe", universeId]);

      if (!universe) {
        return new Error(`Universe ${universeId} not found`);
      }

      const relevantMemories = this.#selectRelevantMemories(
        universe.memories,
        5,
      );

      const prompt = this.#buildEvolvePrompt(universe, relevantMemories);

      const newState = await this.#llm.generate([
        {
          role: "system",
          content:
            "You are a world simulator. Generate a concise description of how the world state has evolved. Focus on significant changes only. Keep it under 200 words.",
        },
        {
          role: "user",
          content: prompt,
        },
      ], {
        temperature: 0.7,
        maxTokens: 300,
      });

      await this.#db.set(["universe", universeId], {
        ...universe,
        currentState: newState,
        lastEvolvedAt: new Date(),
      });

      return newState;
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error(`Failed to evolve universe: ${error}`);
    }
  }

  #selectRelevantMemories(
    memories: UniverseMemoryEntry[],
    limit: number,
  ): UniverseMemoryEntry[] {
    return memories
      .sort((a, b) => b.salience - a.salience)
      .slice(0, limit);
  }

  #buildEvolvePrompt(
    universe: Universe,
    memories: UniverseMemoryEntry[],
  ): string {
    const memoryContext = memories.length > 0
      ? memories.map((m) => `- ${m.content} (importance: ${m.salience})`).join(
        "\n",
      )
      : "No significant memories yet.";

    return `Universe: ${universe.name}
Description: ${universe.description}
Current State: ${universe.currentState}

Relevant Memories:
${memoryContext}

Based on the above, describe how the world has evolved since the last update. What has changed? What events have occurred?`;
  }
}

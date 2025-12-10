import type {
  CharacterMemoryEntry,
  CharacterMemoryPort,
  CreateMemoryEntry,
  LLMPort,
  MemorySearchOptions,
} from "@talae/core";
import {
  MemoryVectorstore,
  type Vectorstore,
} from "./vectorstore/vectorstore.ts";

interface CharacterMemoryMetadata {
  readonly characterId: string;
  readonly entry: CharacterMemoryEntry;
}

export class VectorstoreCharacterMemoryAdapter implements CharacterMemoryPort {
  readonly #llm: LLMPort;
  readonly #vectorstore: Vectorstore;

  constructor(
    llm: LLMPort,
    vectorstore: Vectorstore = new MemoryVectorstore(),
  ) {
    this.#llm = llm;
    this.#vectorstore = vectorstore;
  }

  async addMemory(
    characterId: string,
    entry: CreateMemoryEntry,
  ): Promise<CharacterMemoryEntry> {
    const embedding = await this.#llm.embed(entry.content);
    const storedEntry: CharacterMemoryEntry = {
      id: crypto.randomUUID(),
      content: entry.content,
      salience: entry.salience,
      tags: entry.tags,
      createdAt: new Date(),
    };

    const partition = this.#vectorstore.partition<CharacterMemoryMetadata>(
      this.#characterPartition(characterId),
    );
    await partition.upsert({
      id: storedEntry.id,
      vector: embedding,
      metadata: { characterId, entry: storedEntry },
    });

    return storedEntry;
  }

  async searchMemories(
    characterId: string,
    query: string,
    options?: MemorySearchOptions,
  ): Promise<CharacterMemoryEntry[]> {
    const embedding = await this.#llm.embed(query);
    const partition = this.#vectorstore.partition<CharacterMemoryMetadata>(
      this.#characterPartition(characterId),
    );
    const matches = await partition.query(embedding, { limit: options?.limit });
    return matches.map((match) => match.metadata.entry);
  }

  #characterPartition(characterId: string): string {
    return `character:${characterId}`;
  }
}

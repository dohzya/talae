import type {
  CreateMemoryEntry,
  LLMPort,
  MemorySearchOptions,
  UniverseHistoryPort,
  UniverseMemoryEntry,
} from "@talae/core";
import {
  MemoryVectorstore,
  type Vectorstore,
} from "./vectorstore/vectorstore.ts";

interface UniverseHistoryMetadata {
  readonly universeId: string;
  readonly entry: UniverseMemoryEntry;
}

export class VectorstoreUniverseHistoryAdapter implements UniverseHistoryPort {
  readonly #llm: LLMPort;
  readonly #vectorstore: Vectorstore;

  constructor(
    llm: LLMPort,
    vectorstore: Vectorstore = new MemoryVectorstore(),
  ) {
    this.#llm = llm;
    this.#vectorstore = vectorstore;
  }

  async addEntry(
    universeId: string,
    entry: CreateMemoryEntry,
  ): Promise<UniverseMemoryEntry> {
    const embedding = await this.#llm.embed(entry.content);
    const storedEntry: UniverseMemoryEntry = {
      id: crypto.randomUUID(),
      content: entry.content,
      salience: entry.salience,
      tags: entry.tags,
      createdAt: new Date(),
    };

    const partition = this.#vectorstore.partition<UniverseHistoryMetadata>(
      this.#universePartition(universeId),
    );
    await partition.upsert({
      id: storedEntry.id,
      vector: embedding,
      metadata: { universeId, entry: storedEntry },
    });

    return storedEntry;
  }

  async searchHistory(
    universeId: string,
    query: string,
    options?: MemorySearchOptions,
  ): Promise<UniverseMemoryEntry[]> {
    const embedding = await this.#llm.embed(query);
    const partition = this.#vectorstore.partition<UniverseHistoryMetadata>(
      this.#universePartition(universeId),
    );
    const matches = await partition.query(embedding, { limit: options?.limit });
    return matches.map((match) => match.metadata.entry);
  }

  #universePartition(universeId: string): string {
    return `universe:${universeId}`;
  }
}

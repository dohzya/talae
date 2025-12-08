import type { CharacterMemoryEntry } from "../../domain/character.ts";

export interface MemoryRetrievalOptions {
  readonly limit?: number;
}

interface ScoredMemory {
  readonly memory: CharacterMemoryEntry;
  readonly score: number;
}

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "if",
  "in",
  "into",
  "is",
  "it",
  "no",
  "not",
  "of",
  "on",
  "or",
  "such",
  "that",
  "the",
  "their",
  "then",
  "there",
  "these",
  "they",
  "this",
  "to",
  "was",
  "will",
  "with",
]);

export class MemoryRetrievalService {
  findRelevantMemories(
    memories: CharacterMemoryEntry[],
    queryTexts: string[],
    options?: MemoryRetrievalOptions,
  ): CharacterMemoryEntry[] {
    const limit = options?.limit ?? 10;

    if (memories.length === 0 || limit === 0) {
      return [];
    }

    const queryTokens = this.#tokenize(queryTexts.join(" "));
    if (queryTokens.length === 0) {
      return [...memories]
        .sort((a, b) => b.salience - a.salience)
        .slice(0, limit);
    }

    const queryVector = this.#termFrequency(queryTokens);
    const scored = memories.map((memory) => {
      const tokens = this.#tokenize(
        `${memory.content} ${memory.tags.join(" ")}`,
      );
      const memoryVector = this.#termFrequency(tokens);
      const similarity = this.#cosineSimilarity(queryVector, memoryVector);
      const score = this.#blendScore(similarity, memory.salience);
      return { memory, score } satisfies ScoredMemory;
    });

    return scored
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.memory.createdAt.getTime() - a.memory.createdAt.getTime();
      })
      .slice(0, limit)
      .map((entry) => entry.memory);
  }

  #blendScore(similarity: number, salience: number): number {
    const weightedSimilarity = similarity * 0.7;
    const weightedSalience = salience * 0.3;
    return weightedSimilarity + weightedSalience;
  }

  #tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 0)
      .filter((token) => !STOPWORDS.has(token));
  }

  #termFrequency(tokens: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const token of tokens) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
    return counts;
  }

  #cosineSimilarity(
    queryVector: Map<string, number>,
    memoryVector: Map<string, number>,
  ): number {
    let dotProduct = 0;
    let queryMagnitude = 0;
    let memoryMagnitude = 0;

    for (const value of queryVector.values()) {
      queryMagnitude += value * value;
    }

    for (const [token, value] of memoryVector) {
      memoryMagnitude += value * value;
      const queryValue = queryVector.get(token);
      if (queryValue !== undefined) {
        dotProduct += queryValue * value;
      }
    }

    if (dotProduct === 0 || queryMagnitude === 0 || memoryMagnitude === 0) {
      return 0;
    }

    return dotProduct /
      (Math.sqrt(queryMagnitude) * Math.sqrt(memoryMagnitude));
  }
}

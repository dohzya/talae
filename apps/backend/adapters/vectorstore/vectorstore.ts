export interface VectorstoreRecord<TMetadata> {
  readonly id: string;
  readonly vector: number[];
  readonly metadata: TMetadata;
}

export interface VectorstoreQueryOptions<TMetadata> {
  readonly limit?: number;
  readonly filter?: (metadata: TMetadata) => boolean;
}

export interface VectorstoreMatch<TMetadata> {
  readonly id: string;
  readonly score: number;
  readonly metadata: TMetadata;
}

export interface VectorstorePartition<TMetadata> {
  upsert(entry: VectorstoreRecord<TMetadata>): Promise<void>;
  delete(id: string): Promise<void>;
  query(
    vector: number[],
    options?: VectorstoreQueryOptions<TMetadata>,
  ): Promise<Array<VectorstoreMatch<TMetadata>>>;
}

export interface Vectorstore {
  partition<TMetadata>(name: string): VectorstorePartition<TMetadata>;
}

interface StoredRecord<TMetadata> extends VectorstoreRecord<TMetadata> {
  readonly vectorNorm: number;
}

class MemoryPartition<TMetadata> implements VectorstorePartition<TMetadata> {
  readonly #records = new Map<string, StoredRecord<TMetadata>>();

  async upsert(entry: VectorstoreRecord<TMetadata>): Promise<void> {
    const vectorNorm = this.#computeNorm(entry.vector);
    this.#records.set(entry.id, { ...entry, vectorNorm });
  }

  async delete(id: string): Promise<void> {
    this.#records.delete(id);
  }

  async query(
    vector: number[],
    options?: VectorstoreQueryOptions<TMetadata>,
  ): Promise<Array<VectorstoreMatch<TMetadata>>> {
    const vectorNorm = this.#computeNorm(vector);
    if (vectorNorm === 0) {
      return [];
    }

    const matches: Array<VectorstoreMatch<TMetadata>> = [];
    for (const record of this.#records.values()) {
      if (options?.filter && !options.filter(record.metadata)) {
        continue;
      }
      const score = this.#cosineSimilarity(vector, vectorNorm, record);
      matches.push({ id: record.id, score, metadata: record.metadata });
    }

    matches.sort((a, b) => b.score - a.score);
    const limit = options?.limit ?? matches.length;
    return matches.slice(0, limit);
  }

  #computeNorm(vector: number[]): number {
    const magnitude = Math.sqrt(
      vector.reduce((sum, value) => sum + value * value, 0),
    );
    return Number.isFinite(magnitude) ? magnitude : 0;
  }

  #cosineSimilarity(
    vector: number[],
    vectorNorm: number,
    record: StoredRecord<TMetadata>,
  ): number {
    if (
      vector.length !== record.vector.length || vectorNorm === 0 ||
      record.vectorNorm === 0
    ) {
      return 0;
    }
    const dotProduct = vector.reduce(
      (sum, value, index) => sum + value * record.vector[index],
      0,
    );
    return dotProduct / (vectorNorm * record.vectorNorm);
  }
}

export class MemoryVectorstore implements Vectorstore {
  readonly #partitions = new Map<string, MemoryPartition<unknown>>();

  partition<TMetadata>(name: string): VectorstorePartition<TMetadata> {
    if (!this.#partitions.has(name)) {
      this.#partitions.set(name, new MemoryPartition());
    }
    return this.#partitions.get(name) as MemoryPartition<TMetadata>;
  }
}

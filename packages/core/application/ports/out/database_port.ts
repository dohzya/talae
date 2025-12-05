/**
 * Generic database port for storing and retrieving entities.
 * Implementations should handle persistence (Deno KV, PostgreSQL, etc.).
 */

export interface DatabasePort {
  /**
   * Get an entity by its key.
   * Returns null if not found.
   */
  get<T>(key: string[]): Promise<T | null>;

  /**
   * Set an entity at the given key.
   * Creates or updates the entity.
   */
  set<T>(key: string[], value: T): Promise<void>;

  /**
   * Delete an entity by its key.
   */
  delete(key: string[]): Promise<void>;

  /**
   * List entities with a key prefix.
   * Useful for queries like "all conversations in a universe".
   */
  list<T>(prefix: string[]): Promise<T[]>;

  /**
   * Atomic transaction: set multiple keys or fail all.
   * Used for operations that must succeed or fail together.
   */
  atomic(operations: AtomicOperation[]): Promise<void>;
}

export interface AtomicOperation {
  readonly type: "set" | "delete";
  readonly key: string[];
  readonly value?: unknown;
}

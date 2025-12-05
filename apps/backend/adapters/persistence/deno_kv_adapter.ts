import type { AtomicOperation, DatabasePort } from "@talae/core";

/**
 * Deno KV adapter implementing DatabasePort.
 * Provides persistence using Deno's built-in key-value store.
 */
export class DenoKvAdapter implements DatabasePort {
  readonly #kv: Deno.Kv;

  constructor(kv: Deno.Kv) {
    this.#kv = kv;
  }

  async get<T>(key: string[]): Promise<T | null> {
    const result = await this.#kv.get<T>(key);
    return result.value;
  }

  async set<T>(key: string[], value: T): Promise<void> {
    await this.#kv.set(key, value);
  }

  async delete(key: string[]): Promise<void> {
    await this.#kv.delete(key);
  }

  async list<T>(prefix: string[]): Promise<T[]> {
    const entries: T[] = [];
    const iter = this.#kv.list<T>({ prefix });

    for await (const entry of iter) {
      if (entry.value !== null) {
        entries.push(entry.value);
      }
    }

    return entries;
  }

  async atomic(operations: AtomicOperation[]): Promise<void> {
    let tx = this.#kv.atomic();

    for (const op of operations) {
      if (op.type === "set") {
        tx = tx.set(op.key, op.value);
      } else {
        tx = tx.delete(op.key);
      }
    }

    const result = await tx.commit();
    if (!result.ok) {
      throw new Error("Atomic transaction failed");
    }
  }

  static async create(path?: string): Promise<DenoKvAdapter> {
    const kv = await Deno.openKv(path);
    return new DenoKvAdapter(kv);
  }
}

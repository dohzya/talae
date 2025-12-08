import type { CharacterMemoryEntry } from "../../domain/character.ts";
import { MemoryRetrievalService } from "./memory_retrieval_service.ts";

function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? "Assertion failed");
  }
}

function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message ?? `Expected ${expected} but received ${actual}`);
  }
}

function assertNotUndefined<T>(
  value: T,
  message?: string,
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message ?? "Value should be defined");
  }
}

function assertArrayEquals<T>(
  actual: readonly T[],
  expected: readonly T[],
  message?: string,
): void {
  if (actual.length !== expected.length) {
    throw new Error(message ?? "Array lengths differ");
  }

  for (let index = 0; index < actual.length; index += 1) {
    if (actual[index] !== expected[index]) {
      throw new Error(
        message ??
          `Expected ${expected[index]} at index ${index} but received ${
            actual[index]
          }`,
      );
    }
  }
}

const service = new MemoryRetrievalService();

function createMemory(
  overrides: Partial<CharacterMemoryEntry> & { id: string },
): CharacterMemoryEntry {
  return {
    id: overrides.id,
    content: overrides.content ?? "",
    salience: overrides.salience ?? 0.5,
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? new Date("2024-01-01T00:00:00Z"),
  } satisfies CharacterMemoryEntry;
}

Deno.test("selects semantically close memories even with lower salience", () => {
  const memories: CharacterMemoryEntry[] = [
    createMemory({
      id: "00000000-0000-4000-8000-000000000001",
      content: "Handles spaceship repairs and engine diagnostics",
      salience: 0.4,
    }),
    createMemory({
      id: "00000000-0000-4000-8000-000000000002",
      content: "Enjoys visiting coastal towns during summer",
      salience: 0.9,
    }),
    createMemory({
      id: "00000000-0000-4000-8000-000000000003",
      content: "Discussed rare spices at the market with the user",
      salience: 0.6,
    }),
  ];

  const results = service.findRelevantMemories(
    memories,
    ["The spaceship engine failed after our last jump"],
    { limit: 2 },
  );

  assertEquals(results.length, 2);
  const [first, second] = results;
  assertNotUndefined(first);
  assertNotUndefined(second);
  assertEquals(first.id, "00000000-0000-4000-8000-000000000001");
  assert(second.salience >= first.salience);
});

Deno.test("falls back to salience ordering without query terms", () => {
  const memories: CharacterMemoryEntry[] = [
    createMemory({
      id: "00000000-0000-4000-8000-000000000004",
      content: "Low priority",
      salience: 0.2,
    }),
    createMemory({
      id: "00000000-0000-4000-8000-000000000005",
      content: "High priority",
      salience: 0.8,
    }),
  ];

  const results = service.findRelevantMemories(memories, [], { limit: 2 });

  assertArrayEquals(results.map((m) => m.id), [
    "00000000-0000-4000-8000-000000000005",
    "00000000-0000-4000-8000-000000000004",
  ]);
});

import type {
  CharacterId,
  CharacterMemoryEntry,
} from "../../domain/character.ts";
import type { UniverseId, UniverseMemoryEntry } from "../../domain/universe.ts";
import type { CreateMemoryEntry } from "../../domain/memory.ts";

export interface MemorySearchOptions {
  readonly limit?: number;
}

export interface CharacterMemoryPort {
  addMemory(
    characterId: CharacterId,
    entry: CreateMemoryEntry,
  ): Promise<CharacterMemoryEntry>;

  searchMemories(
    characterId: CharacterId,
    query: string,
    options?: MemorySearchOptions,
  ): Promise<CharacterMemoryEntry[]>;
}

export interface UniverseHistoryPort {
  addEntry(
    universeId: UniverseId,
    entry: CreateMemoryEntry,
  ): Promise<UniverseMemoryEntry>;

  searchHistory(
    universeId: UniverseId,
    query: string,
    options?: MemorySearchOptions,
  ): Promise<UniverseMemoryEntry[]>;
}

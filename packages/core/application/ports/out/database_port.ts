/**
 * Generic database port for storing and retrieving entities.
 * Implementations should handle persistence (Deno KV, PostgreSQL, etc.).
 */

import type {
  Character,
  Conversation,
  CreateCharacter,
  CreateConversation,
  CreateMessage,
  CreateUniverse,
  CreateUser,
  Message,
  Universe,
  User,
} from "../../../domain/mod.ts";

export interface DatabasePort {
  // User operations
  createUser(data: CreateUser): Promise<User>;
  getUser(id: string): Promise<User | null>;

  // Universe operations
  createUniverse(data: CreateUniverse): Promise<Universe>;
  getUniverse(id: string): Promise<Universe | null>;
  listUniverses(): Promise<Universe[]>;
  updateUniverse(id: string, updates: Partial<Universe>): Promise<void>;

  // Character operations
  createCharacter(data: CreateCharacter): Promise<Character>;
  getCharacter(id: string): Promise<Character | null>;
  listCharactersByUniverse(universeId: string): Promise<Character[]>;
  updateCharacter(id: string, updates: Partial<Character>): Promise<void>;

  // Conversation operations
  createConversation(data: CreateConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | null>;
  listConversationsByUser(userId: string): Promise<Conversation[]>;
  listConversationsByCharacter(characterId: string): Promise<Conversation[]>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<void>;

  // Message operations
  createMessage(data: CreateMessage): Promise<Message>;
  getMessage(id: string): Promise<Message | null>;
  listMessagesByConversation(conversationId: string): Promise<Message[]>;
}

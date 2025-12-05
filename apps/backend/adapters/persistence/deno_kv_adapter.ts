import type { DatabasePort } from "@talae/core";
import {
  type Character,
  CharacterSchema,
  type Conversation,
  ConversationSchema,
  type CreateCharacter,
  CreateCharacterSchema,
  type CreateConversation,
  CreateConversationSchema,
  type CreateMessage,
  CreateMessageSchema,
  type CreateUniverse,
  CreateUniverseSchema,
  type CreateUser,
  CreateUserSchema,
  type Message,
  MessageSchema,
  type Universe,
  UniverseSchema,
  type User,
  UserSchema,
} from "@talae/core";

/**
 * Deno KV adapter implementing DatabasePort.
 * Provides persistence using Deno's built-in key-value store.
 */
export class DenoKvAdapter implements DatabasePort {
  readonly #kv: Deno.Kv;

  constructor(kv: Deno.Kv) {
    this.#kv = kv;
  }

  // User operations
  async createUser(data: CreateUser): Promise<User> {
    const validated = CreateUserSchema.parse(data);
    const id = crypto.randomUUID();
    const user: User = {
      id,
      name: validated.name,
      email: validated.email,
      createdAt: new Date(),
    };
    await this.#kv.set(["users", id], user);
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    const result = await this.#kv.get<User>(["users", id]);
    return result.value ? UserSchema.parse(result.value) : null;
  }

  // Universe operations
  async createUniverse(data: CreateUniverse): Promise<Universe> {
    const validated = CreateUniverseSchema.parse(data);
    const id = crypto.randomUUID();
    const now = new Date();
    const universe: Universe = {
      id,
      ownerId: validated.ownerId,
      name: validated.name,
      description: validated.description,
      currentState: validated.currentState,
      memories: [],
      createdAt: now,
      lastEvolvedAt: now,
    };
    await this.#kv.set(["universes", id], universe);
    return universe;
  }

  async getUniverse(id: string): Promise<Universe | null> {
    const result = await this.#kv.get<Universe>(["universes", id]);
    return result.value ? UniverseSchema.parse(result.value) : null;
  }

  async listUniverses(): Promise<Universe[]> {
    const universes: Universe[] = [];
    const iter = this.#kv.list<Universe>({ prefix: ["universes"] });
    for await (const entry of iter) {
      if (entry.value) {
        universes.push(UniverseSchema.parse(entry.value));
      }
    }
    return universes;
  }

  async updateUniverse(
    id: string,
    updates: Partial<Universe>,
  ): Promise<void> {
    const existing = await this.getUniverse(id);
    if (!existing) throw new Error(`Universe ${id} not found`);
    const updated = { ...existing, ...updates };
    await this.#kv.set(["universes", id], UniverseSchema.parse(updated));
  }

  // Character operations
  async createCharacter(data: CreateCharacter): Promise<Character> {
    const validated = CreateCharacterSchema.parse(data);
    const id = crypto.randomUUID();
    const character: Character = {
      id,
      universeId: validated.universeId,
      name: validated.name,
      description: validated.description,
      currentState: validated.currentState,
      availability: validated.availability,
      availableUntil: validated.availableUntil ?? null,
      memories: [],
      createdAt: new Date(),
    };
    await this.#kv.set(["characters", id], character);
    return character;
  }

  async getCharacter(id: string): Promise<Character | null> {
    const result = await this.#kv.get<Character>(["characters", id]);
    return result.value ? CharacterSchema.parse(result.value) : null;
  }

  async listCharactersByUniverse(universeId: string): Promise<Character[]> {
    const characters: Character[] = [];
    const iter = this.#kv.list<Character>({ prefix: ["characters"] });
    for await (const entry of iter) {
      if (entry.value && entry.value.universeId === universeId) {
        characters.push(CharacterSchema.parse(entry.value));
      }
    }
    return characters;
  }

  async updateCharacter(
    id: string,
    updates: Partial<Character>,
  ): Promise<void> {
    const existing = await this.getCharacter(id);
    if (!existing) throw new Error(`Character ${id} not found`);
    const updated = { ...existing, ...updates };
    await this.#kv.set(["characters", id], CharacterSchema.parse(updated));
  }

  // Conversation operations
  async createConversation(
    data: CreateConversation,
  ): Promise<Conversation> {
    const validated = CreateConversationSchema.parse(data);
    const id = crypto.randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      id,
      userId: validated.userId,
      characterId: validated.characterId,
      createdAt: now,
      lastMessageAt: now,
    };
    await this.#kv.set(["conversations", id], conversation);
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const result = await this.#kv.get<Conversation>(["conversations", id]);
    return result.value ? ConversationSchema.parse(result.value) : null;
  }

  async listConversationsByUser(userId: string): Promise<Conversation[]> {
    const conversations: Conversation[] = [];
    const iter = this.#kv.list<Conversation>({ prefix: ["conversations"] });
    for await (const entry of iter) {
      if (entry.value && entry.value.userId === userId) {
        conversations.push(ConversationSchema.parse(entry.value));
      }
    }
    return conversations;
  }

  async listConversationsByCharacter(
    characterId: string,
  ): Promise<Conversation[]> {
    const conversations: Conversation[] = [];
    const iter = this.#kv.list<Conversation>({ prefix: ["conversations"] });
    for await (const entry of iter) {
      if (entry.value && entry.value.characterId === characterId) {
        conversations.push(ConversationSchema.parse(entry.value));
      }
    }
    return conversations;
  }

  async updateConversation(
    id: string,
    updates: Partial<Conversation>,
  ): Promise<void> {
    const existing = await this.getConversation(id);
    if (!existing) throw new Error(`Conversation ${id} not found`);
    const updated = { ...existing, ...updates };
    await this.#kv.set(
      ["conversations", id],
      ConversationSchema.parse(updated),
    );
  }

  // Message operations
  async createMessage(data: CreateMessage): Promise<Message> {
    const validated = CreateMessageSchema.parse(data);
    const id = crypto.randomUUID();
    const message: Message = {
      id,
      conversationId: validated.conversationId,
      role: validated.role,
      content: validated.content,
      createdAt: new Date(),
    };
    await this.#kv.set(["messages", id], message);
    return message;
  }

  async getMessage(id: string): Promise<Message | null> {
    const result = await this.#kv.get<Message>(["messages", id]);
    return result.value ? MessageSchema.parse(result.value) : null;
  }

  async listMessagesByConversation(
    conversationId: string,
  ): Promise<Message[]> {
    const messages: Message[] = [];
    const iter = this.#kv.list<Message>({ prefix: ["messages"] });
    for await (const entry of iter) {
      if (entry.value && entry.value.conversationId === conversationId) {
        messages.push(MessageSchema.parse(entry.value));
      }
    }
    return messages.sort((a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  static async create(path?: string): Promise<DenoKvAdapter> {
    const kv = await Deno.openKv(path);
    return new DenoKvAdapter(kv);
  }
}

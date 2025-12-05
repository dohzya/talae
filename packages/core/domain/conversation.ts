import { z } from "@zod/zod";
import type { UserId } from "./user.ts";
import type { CharacterId } from "./character.ts";

export const ConversationIdSchema = z.string().uuid();
export type ConversationId = z.infer<typeof ConversationIdSchema>;

export const ConversationSchema = z.object({
  id: ConversationIdSchema,
  userId: z.string().uuid() satisfies z.ZodType<UserId>,
  characterId: z.string().uuid() satisfies z.ZodType<CharacterId>,
  createdAt: z.date(),
  lastMessageAt: z.date(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const CreateConversationSchema = ConversationSchema.omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export type CreateConversation = z.infer<typeof CreateConversationSchema>;

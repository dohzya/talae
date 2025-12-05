import { z } from "@zod/zod";
import type { ConversationId } from "./conversation.ts";

export const MessageIdSchema = z.string().uuid();
export type MessageId = z.infer<typeof MessageIdSchema>;

export const MessageRoleSchema = z.enum(["user", "character"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageSchema = z.object({
  id: MessageIdSchema,
  conversationId: z.string().uuid() satisfies z.ZodType<ConversationId>,
  role: MessageRoleSchema,
  content: z.string().min(1),
  createdAt: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;

export const CreateMessageSchema = MessageSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateMessage = z.infer<typeof CreateMessageSchema>;

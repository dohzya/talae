import type { Context } from "hono";
import type { DatabasePort, LLMPort } from "@talae/core";
import {
  ConversationIdSchema,
  ConversationSchema,
  CreateConversationSchema,
  CreateMessageSchema,
  MessageSchema,
  UniverseIdSchema,
} from "@talae/core";

/**
 * Universe-scoped routes: /api/universe/:univId/...
 */
export function createUniverseRoutes(
  db: DatabasePort,
  llm: LLMPort,
) {
  return {
    async getUniverse(c: Context) {
      const univId = c.req.param("univId");
      const parsed = UniverseIdSchema.safeParse(univId);

      if (!parsed.success) {
        return c.json({ error: "Invalid universe ID" }, 400);
      }

      const universe = await db.get(["universe", univId]);

      if (!universe) {
        return c.json({ error: "Universe not found" }, 404);
      }

      return c.json(universe);
    },

    async listConversations(c: Context) {
      const univId = c.req.param("univId");
      const parsed = UniverseIdSchema.safeParse(univId);

      if (!parsed.success) {
        return c.json({ error: "Invalid universe ID" }, 400);
      }

      const conversations = await db.list([
        "universe",
        univId,
        "conversations",
      ]);
      return c.json({ conversations });
    },

    async createConversation(c: Context) {
      const univId = c.req.param("univId");
      const body = await c.req.json();

      const parsedId = UniverseIdSchema.safeParse(univId);
      if (!parsedId.success) {
        return c.json({ error: "Invalid universe ID" }, 400);
      }

      const parsed = CreateConversationSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({
          error: "Invalid conversation data",
          details: parsed.error,
        }, 400);
      }

      const conversationId = crypto.randomUUID();
      const now = new Date();

      const conversation = ConversationSchema.parse({
        id: conversationId,
        userId: parsed.data.userId,
        characterId: parsed.data.characterId,
        createdAt: now,
        lastMessageAt: now,
      });

      await db.set(
        ["universe", univId, "conversations", conversationId],
        conversation,
      );

      return c.json(conversation, 201);
    },

    async getConversation(c: Context) {
      const univId = c.req.param("univId");
      const convId = c.req.param("convId");

      const parsedUnivId = UniverseIdSchema.safeParse(univId);
      const parsedConvId = ConversationIdSchema.safeParse(convId);

      if (!parsedUnivId.success || !parsedConvId.success) {
        return c.json({ error: "Invalid ID" }, 400);
      }

      const conversation = await db.get([
        "universe",
        univId,
        "conversations",
        convId,
      ]);

      if (!conversation) {
        return c.json({ error: "Conversation not found" }, 404);
      }

      return c.json(conversation);
    },

    async listMessages(c: Context) {
      const univId = c.req.param("univId");
      const convId = c.req.param("convId");

      const parsedUnivId = UniverseIdSchema.safeParse(univId);
      const parsedConvId = ConversationIdSchema.safeParse(convId);

      if (!parsedUnivId.success || !parsedConvId.success) {
        return c.json({ error: "Invalid ID" }, 400);
      }

      const messages = await db.list([
        "conversation",
        convId,
        "messages",
      ]);

      return c.json({ messages });
    },

    async sendMessage(c: Context) {
      const univId = c.req.param("univId");
      const convId = c.req.param("convId");
      const body = await c.req.json();

      const parsedUnivId = UniverseIdSchema.safeParse(univId);
      const parsedConvId = ConversationIdSchema.safeParse(convId);

      if (!parsedUnivId.success || !parsedConvId.success) {
        return c.json({ error: "Invalid ID" }, 400);
      }

      const parsed = CreateMessageSchema.safeParse(body);
      if (!parsed.success) {
        return c.json(
          { error: "Invalid message data", details: parsed.error },
          400,
        );
      }

      const messageId = crypto.randomUUID();
      const now = new Date();

      const message = MessageSchema.parse({
        id: messageId,
        conversationId: convId,
        role: parsed.data.role,
        content: parsed.data.content,
        createdAt: now,
      });

      await db.set(["conversation", convId, "messages", messageId], message);

      return c.json(message, 201);
    },

    async streamCharacterResponse(c: Context) {
      const univId = c.req.param("univId");
      const convId = c.req.param("convId");
      const body = await c.req.json();

      const parsedUnivId = UniverseIdSchema.safeParse(univId);
      const parsedConvId = ConversationIdSchema.safeParse(convId);

      if (!parsedUnivId.success || !parsedConvId.success) {
        return c.json({ error: "Invalid ID" }, 400);
      }

      const parsed = CreateMessageSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: "Invalid message data" }, 400);
      }

      const userMessageId = crypto.randomUUID();
      const now = new Date();

      const userMessage = MessageSchema.parse({
        id: userMessageId,
        conversationId: convId,
        role: "user",
        content: parsed.data.content,
        createdAt: now,
      });

      await db.set(
        ["conversation", convId, "messages", userMessageId],
        userMessage,
      );

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          function sendSSE(data: string) {
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          try {
            const messages = await db.list([
              "conversation",
              convId,
              "messages",
            ]);

            interface StoredMessage {
              role: string;
              content: string;
            }

            const llmMessages = (messages as StoredMessage[]).map((msg) => ({
              role: msg.role === "user"
                ? "user" as const
                : "assistant" as const,
              content: msg.content,
            }));

            let fullResponse = "";

            for await (const chunk of llm.generateStream(llmMessages)) {
              fullResponse += chunk;
              sendSSE(JSON.stringify({ content: chunk }));
            }

            const characterMessageId = crypto.randomUUID();
            const characterMessage = MessageSchema.parse({
              id: characterMessageId,
              conversationId: convId,
              role: "character",
              content: fullResponse,
              createdAt: new Date(),
            });

            await db.set(
              ["conversation", convId, "messages", characterMessageId],
              characterMessage,
            );

            sendSSE(
              JSON.stringify({ done: true, messageId: characterMessageId }),
            );
            controller.close();
          } catch (error) {
            sendSSE(
              JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
              }),
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    },
  };
}

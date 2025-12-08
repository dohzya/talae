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
    async listUniverses(c: Context) {
      const universes = await db.listUniverses();
      return c.json(universes);
    },

    async getUniverse(c: Context) {
      const univId = c.req.param("univId");
      const parsed = UniverseIdSchema.safeParse(univId);

      if (!parsed.success) {
        return c.json({ error: "Invalid universe ID" }, 400);
      }

      const universe = await db.getUniverse(univId);

      if (!universe) {
        return c.json({ error: "Universe not found" }, 404);
      }

      return c.json(universe);
    },

    async listCharacters(c: Context) {
      const univId = c.req.param("univId");
      const parsed = UniverseIdSchema.safeParse(univId);

      if (!parsed.success) {
        return c.json({ error: "Invalid universe ID" }, 400);
      }

      const characters = await db.listCharactersByUniverse(univId);
      return c.json(characters);
    },

    async listConversations(c: Context) {
      const univId = c.req.param("univId");
      const parsed = UniverseIdSchema.safeParse(univId);

      if (!parsed.success) {
        return c.json({ error: "Invalid universe ID" }, 400);
      }

      const universe = await db.getUniverse(univId);
      if (!universe) {
        return c.json({ error: "Universe not found" }, 404);
      }

      const characters = await db.listCharactersByUniverse(univId);
      const allConversations = await Promise.all(
        characters.map((char) => db.listConversationsByCharacter(char.id)),
      );
      const conversations = allConversations.flat();

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

      const conversation = await db.createConversation({
        userId: parsed.data.userId,
        characterId: parsed.data.characterId,
      });

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

      const conversation = await db.getConversation(convId);

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

      const messages = await db.listMessagesByConversation(convId);

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

      const message = await db.createMessage({
        conversationId: convId,
        role: parsed.data.role,
        content: parsed.data.content,
      });

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

      const userMessage = await db.createMessage({
        conversationId: convId,
        role: "user",
        content: parsed.data.content,
      });

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          function sendSSE(data: string) {
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          try {
            const messages = await db.listMessagesByConversation(convId);

            const llmMessages = messages.map((msg) => ({
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

            const characterMessage = await db.createMessage({
              conversationId: convId,
              role: "character",
              content: fullResponse,
            });

            sendSSE(
              JSON.stringify({ done: true, messageId: characterMessage.id }),
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
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    },
  };
}

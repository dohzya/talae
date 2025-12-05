import { Hono } from "hono";
import type { DatabasePort, LLMPort } from "@talae/core";
import { createUniverseRoutes } from "./routes/universe_routes.ts";

export interface AppDependencies {
  readonly db: DatabasePort;
  readonly llm: LLMPort;
}

export function createApp(deps: AppDependencies) {
  const app = new Hono();

  app.use("/*", async (c, next) => {
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type");

    if (c.req.method === "OPTIONS") {
      return c.body(null, 204);
    }

    await next();
  });

  app.get("/", (c) => {
    return c.json({
      name: "TALAE API",
      version: "0.1.0",
      status: "running",
    });
  });

  app.get("/health", (c) => {
    return c.json({ status: "healthy" });
  });

  const universeRoutes = createUniverseRoutes(deps.db, deps.llm);

  app.get("/api/universes", universeRoutes.listUniverses);
  app.get("/api/universes/:univId", universeRoutes.getUniverse);
  app.get("/api/universe/:univId", universeRoutes.getUniverse);
  app.get("/api/universe/:univId/characters", universeRoutes.listCharacters);
  app.get(
    "/api/universe/:univId/conversations",
    universeRoutes.listConversations,
  );
  app.post(
    "/api/universe/:univId/conversations",
    universeRoutes.createConversation,
  );
  app.get(
    "/api/universe/:univId/conversations/:convId",
    universeRoutes.getConversation,
  );
  app.get(
    "/api/universe/:univId/conversations/:convId/messages",
    universeRoutes.listMessages,
  );
  app.post(
    "/api/universe/:univId/conversations/:convId/messages",
    universeRoutes.sendMessage,
  );
  app.post(
    "/api/universe/:univId/conversations/:convId/stream",
    universeRoutes.streamCharacterResponse,
  );

  return app;
}

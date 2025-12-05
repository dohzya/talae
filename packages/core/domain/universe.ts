import { z } from "@zod/zod";
import type { UserId } from "./user.ts";

export const UniverseIdSchema = z.string().uuid();
export type UniverseId = z.infer<typeof UniverseIdSchema>;

export const UniverseMemoryEntrySchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  salience: z.number().min(0).max(1),
  tags: z.array(z.string()),
  createdAt: z.date(),
});

export type UniverseMemoryEntry = z.infer<typeof UniverseMemoryEntrySchema>;

export const UniverseSchema = z.object({
  id: UniverseIdSchema,
  ownerId: z.string().uuid() satisfies z.ZodType<UserId>,
  name: z.string().min(1),
  description: z.string(),
  currentState: z.string(),
  memories: z.array(UniverseMemoryEntrySchema),
  createdAt: z.date(),
  lastEvolvedAt: z.date(),
});

export type Universe = z.infer<typeof UniverseSchema>;

export const CreateUniverseSchema = UniverseSchema.omit({
  id: true,
  memories: true,
  createdAt: true,
  lastEvolvedAt: true,
}).extend({
  currentState: z.string().optional().default(""),
});

export type CreateUniverse = z.infer<typeof CreateUniverseSchema>;

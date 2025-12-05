import { z } from "@zod/zod";
import type { UniverseId } from "./universe.ts";

export const CharacterIdSchema = z.string().uuid();
export type CharacterId = z.infer<typeof CharacterIdSchema>;

export const AvailabilitySchema = z.enum(["Available", "NonAvailable"]);
export type Availability = z.infer<typeof AvailabilitySchema>;

export const CharacterMemoryEntrySchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  salience: z.number().min(0).max(1),
  tags: z.array(z.string()),
  createdAt: z.date(),
});

export type CharacterMemoryEntry = z.infer<typeof CharacterMemoryEntrySchema>;

export const CharacterSchema = z.object({
  id: CharacterIdSchema,
  universeId: z.string().uuid() satisfies z.ZodType<UniverseId>,
  name: z.string().min(1),
  description: z.string(),
  currentState: z.string(),
  availability: AvailabilitySchema,
  availableUntil: z.date().nullable(),
  memories: z.array(CharacterMemoryEntrySchema),
  createdAt: z.date(),
});

export type Character = z.infer<typeof CharacterSchema>;

export const CreateCharacterSchema = CharacterSchema.omit({
  id: true,
  memories: true,
  createdAt: true,
}).extend({
  currentState: z.string().optional().default(""),
  availability: AvailabilitySchema.optional().default("Available"),
  availableUntil: z.date().nullable().optional().default(null),
});

export type CreateCharacter = z.infer<typeof CreateCharacterSchema>;

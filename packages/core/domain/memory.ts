import { z } from "@zod/zod";

export const MemoryEntryIdSchema = z.string().uuid();
export type MemoryEntryId = z.infer<typeof MemoryEntryIdSchema>;

export const MemoryTypeSchema = z.enum(["character", "universe"]);
export type MemoryType = z.infer<typeof MemoryTypeSchema>;

export const BaseMemoryEntrySchema = z.object({
  id: MemoryEntryIdSchema,
  content: z.string(),
  salience: z.number().min(0).max(1),
  tags: z.array(z.string()),
  createdAt: z.date(),
});

export type BaseMemoryEntry = z.infer<typeof BaseMemoryEntrySchema>;

export const CreateMemoryEntrySchema = BaseMemoryEntrySchema.omit({
  id: true,
  createdAt: true,
});

export type CreateMemoryEntry = z.infer<typeof CreateMemoryEntrySchema>;

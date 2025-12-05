import { z } from "@zod/zod";

export const UserIdSchema = z.string().uuid();
export type UserId = z.infer<typeof UserIdSchema>;

export const UserSchema: z.ZodObject<{
  id: z.ZodString;
  name: z.ZodString;
  createdAt: z.ZodDate;
}> = z.object({
  id: UserIdSchema,
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true });
export type CreateUser = z.infer<typeof CreateUserSchema>;

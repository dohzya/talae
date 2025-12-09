import { z } from "@zod/zod/mini";

/**
 * Wraps a schema to make it optional and normalize undefined.
 * Equivalent to z.pipe(z.optional(schema), z.transform(v => v)).
 * Useful for fields that can be omitted from input but should resolve to undefined.
 */
export function undefinable<S extends z.ZodMiniType<unknown>>(
  schema: S,
): z.ZodMiniPipe<
  z.ZodMiniOptional<S>,
  z.ZodMiniTransform<
    Awaited<z.core.output<S>> | undefined,
    z.core.output<S> | undefined
  >
> {
  return z.pipe(z.optional(schema), z.transform((v) => v));
}

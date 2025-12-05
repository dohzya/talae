/**
 * Tests for ExplicitCast utility.
 */

import { assertEquals } from "@std/assert";
import { ExplicitCast } from "./explicit_cast.ts";

Deno.test("ExplicitCast.unknown - returns unknown as-is", () => {
  const value: unknown = "test";
  const result = ExplicitCast.unknown(value);
  // Should return unknown as-is (for Zod parsing, not direct casting)
  assertEquals(result, "test");
  assertEquals(typeof result, "string");
});

Deno.test("ExplicitCast.unknown - preserves unknown type", () => {
  const value: unknown = 42;
  const result: unknown = ExplicitCast.unknown(value);
  assertEquals(result, 42);
});

Deno.test("ExplicitCast.from - cast with type parameter", () => {
  const value = 42;
  const result = ExplicitCast.from<number>(value).cast<number>();
  assertEquals(result, 42);
});

Deno.test("ExplicitCast.from - dangerousCast", () => {
  const value = "test";
  // dangerousCast allows unsafe casts, just verify it doesn't throw
  const result: number = ExplicitCast.from<string>(value).dangerousCast<
    number
  >();
  // At runtime, the value is still a string, but TypeScript treats it as number
  assertEquals(ExplicitCast.unknown(result), "test");
});

Deno.test("ExplicitCast.fromAny - cast any value", () => {
  // deno-lint-ignore no-explicit-any
  const value: any = "test";
  const result = ExplicitCast.fromAny(value).cast<string>();
  assertEquals(result, "test");
});

Deno.test("ExplicitCast.fromAny - cast any to different type", () => {
  // deno-lint-ignore no-explicit-any
  const value: any = 42;
  const result: string = ExplicitCast.fromAny(value).cast<string>();
  // At runtime, the value is still a number, but TypeScript treats it as string
  assertEquals(ExplicitCast.unknown(result), 42);
});

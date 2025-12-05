/**
 * Explicit type casting utilities to replace `as` type assertions.
 * Use these instead of direct type assertions for better type safety and clarity.
 */

/* eslint-disable @typescript-eslint/consistent-type-assertions */

export const ExplicitCast = {
  /** Casts value `any` received by some libs. Prefer using .unknown() when possible. */
  fromAny: <TParam>(value: TParam) => ({
    cast: <TResult>(): 0 extends 1 & TParam ? TResult : TypeError =>
      value as 0 extends 1 & TParam ? TResult : TypeError,
  }),

  /** Forces considering `any` values (e.g., JSON.parse results) as unknown */
  unknown: (value: unknown) => value,

  /** Casts a given value (which type needs to be explicited) */
  from: <TParam = never>(value: NoInfer<TParam>) => ({
    cast: <TResult>(): TResult extends TParam ? TResult : TypeError =>
      value as unknown as TResult extends TParam ? TResult : TypeError,
    /** Prefer using cast when possible */
    dangerousCast: <TResult>(): TResult => value as unknown as TResult,
  }),
};

/* eslint-enable @typescript-eslint/consistent-type-assertions */

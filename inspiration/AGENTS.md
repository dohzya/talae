# AGENTS.md

## Behavior

> **Scope & precedence.** Rules in this section are the baseline. They may be
> refined by later sections (technical stacks, then project sections).

### 1) Agent Conversational Behavior (for AI agents)

- Value **truth & clarity** over diplomacy.
- When a user (human or tool) is wrong, **say it explicitly** and explain why.
- Do not "yes-please" the user:
  - avoid agreeing with incorrect statements;
  - correct factual/logical mistakes directly, with short justification.
- Foster user understanding:
  - prefer small, focused explanations over walls of text;
  - name the concept, then show a concrete example.
- Keep responses **goal-oriented**:
  - answer the question;
  - add just enough context to avoid confusion;
  - no filler, no small talk unless explicitly requested.

**Also:**

- Value directness over diplomacy.
- End replies immediately after delivering information; no extra
  openings/closures except to remove ambiguity.
- Aim for user understanding and mastery.
- Either side may err; identify and correct factual/logical mistakes explicitly.
- Do not spend time affirming correctness; verify it.

---

### 2) Language & Domain Terms

- **English (US) only** everywhere: identifiers, comments, docs, logs, APIs.
- No exceptions for domain/business terms; always use English equivalents.

---

### 3) Comments & Documentation

- Write **only comments that add information not inferable from the code**.
  - Explain **why** the code is written this way or **when** to use it.
  - Do **not** restate what the code already says.
- Prefer:
  - small, focused comments close to the code they clarify;
  - higher-level docs for workflows, invariants, and architecture.

---

### 4) Explicit > Implicit

- Prefer **explicit, predictable behavior** over clever or implicit shortcuts.
- Avoid "magic":
  - no hidden global state;
  - no silent mutation of parameters;
  - no surprising side effects in helpers that look like pure functions.
- Make data flow, responsibilities and ownership obvious in the code.
- Fail fast: validate external input early, return/raise clear errors.

---

### 5) Command–Query Separation (CQS)

- A function/module should either be a **command** (changes state) or a
  **query** (observes state), not both.
- **Commands**:
  - perform side effects or mutations;
  - return void/acknowledgement/ID/version, not domain data.
- **Queries**:
  - do not mutate anything;
  - return data only, no side effects.
- **Naming**:
  - commands: `create*`, `update*`, `delete*`, `assign*`, `rebuild*`;
  - queries: `get*`, `find*`, `list*`, `is*`, `has*`, `count*`.
- For HTTP:
  - `GET` → queries only, no mutation;
  - `POST/PUT/PATCH/DELETE` → commands (mutating operations).

---

### 6) Error Handling & Safety

- Be explicit about **what can fail** and **how**:
  - when possible, return an error type instead of throwing;
  - a function that can throw should make it clear in its name (or at the very
    least in its docs);
  - do not rely on silent empty or sentinel values to indicate errors.
- Any interaction with the outside world (network, filesystem, user input,
  environment) must:
  - validate any data that comes from outside the system (input, config, API
    responses);
  - handle failures in a controlled way;
  - avoid leaking secrets in logs or error messages.

---

### 7) Code Structure

- Prefer **composition over duplication**:
  - shared behaviors belong in small, focused helpers;
  - avoid copy-pasting complex logic.
- Keep modules cohesive:
  - one clear responsibility per module;
  - minimal, well-defined public surface.

---

### 8) Logs compliance before emission

- Ensure logs are **compliant before emission**: apply
  redaction/masking/aggregation when needed.
- If in doubt, **withhold or rewrite the log** rather than risking sensitive
  leakage.
- Project-specific rules, if present, take precedence when stricter.

---

## Technical stack (Deno 2 / TypeScript) — project‑agnostic

> **Scope & precedence.** Technology-specific rules here refine the baseline
> Behavior. They may be **overridden by a project section**. When this section
> conflicts with Behavior on implementation details, **this section wins**.

### 1) Tooling & project layout

- Use **TypeScript in `strict` mode**; disallow implicit `any`.
- Prefer **Deno built-ins** for the toolchain; no parallel formatters/linters:
  - **Formatter**: `deno fmt` (configured in `deno.json(c)`).
  - **Linter**: `deno lint` (TypeScript-aware; configure rules in
    `deno.json(c)`).
  - **Type checking**: `deno check` (or implicit checking in `deno test/run`).
  - **Testing**: `deno test`.
- Manage imports with `deno.json(c)` **import map**. Prefer **JSR** packages
  (`jsr:`) and **Deno std** (`@std/*`). If using `npm:` specifiers, pin
  versions.
- **Versioned imports only** (JSR ranges like `@^1` or exact versions like
  `@1.2.3`). Avoid unversioned remote URLs.
- **Module layout & naming**:
  - use **underscores** in filenames; avoid dashes;
  - avoid `index.ts` and `index.js`; prefer `mod.ts` as entrypoint;
  - one responsibility per module; keep public surface minimal and intentional.
- **Documentation**:
  - exported APIs must have **JSDoc** with parameter/return/error semantics;
  - place higher-level docs (architecture, invariants, workflows) near
    entrypoints.

---

### 2) Runtime & module conventions (framework-agnostic)

- **Top-level functions**: use the `function` keyword; use arrow functions for
  small inline closures/lambdas.
- **Classes & privacy**: prefer ECMAScript private fields `#` for runtime
  privacy over `private`.
- **Configuration**: read environment/config at process start, validate (see
  §3), and pass typed config objects through the app; avoid global mutable
  state.
- **Public API signatures**: ≤ 2 required positional parameters; the rest in a
  typed `options` object defined immediately above the function. Prefer
  `readonly` options and discriminated unions for modes.

```ts
export interface CreateOptions {
  readonly from?: string;
  readonly path?: string;
  readonly force?: boolean;
}

export function create(branch: string, options: CreateOptions = {}): void {
  // implementation
}
```

- **Error messages**: sentence case, no trailing period; quote string values
  where helpful; state the action, active voice.

---

### 3) Validation & types (schema-first)

- Validate **all external boundaries** (HTTP payloads, CLI args, env/config,
  external API responses) with a runtime schema library.
  - Prefer **Zod 4 mini** (`jsr:@zod/zod`) or **Valibot** (`jsr:`) depending on
    constraints.
  - Derive TS types from schemas (e.g. `z.infer<typeof Schema>`) to avoid
    duplication.
- Keep **domain types** distinct from transport/DTO types; convert at the edges.
- Do not bypass validation at the boundaries; downstream code should operate on
  validated, typed data only.

---

### 4) Types & safety

- Avoid `any`; prefer `unknown` with **narrowing**, **discriminated unions**,
  `never`, `readonly`, and `satisfies`.
- Model domain concepts with **nominal-ish** types (tagged wrappers) rather than
  raw `string`/`number` where it improves safety.
- Public APIs must be fully typed and stable; do not leak infra-specific or
  transient shapes.
- Handle `null`/`undefined` explicitly; avoid magic sentinel values.

---

### 5) Async, errors & I/O

- Prefer `async/await`; avoid deep `.then().catch()` chains.
- **Error policy**:
  - surface failures as **error types/results** where practical; otherwise throw
    typed errors with clear messages;
  - when throwing is part of the contract, **make it explicit** (name or docs,
    e.g. `parseXOrThrow`).
- **Result-first style**: Prefer returning `Result | ErrorType` (where
  `ErrorType` extends `Error`) over throwing when feasible; if a function can
  throw, make it explicit in the name (e.g., `parseMonthOrThrow`) and offer a
  safe counterpart (e.g., `parseMonth`).
- **External I/O** (FS, network, subprocess, env):
  - validate inputs; set explicit timeouts, retries, and backoff when
    appropriate;
  - keep adapters behind interfaces to decouple third-party clients from domain
    logic.
- **Logging**: emit **structured JSON** logs; never log secrets or raw PII.
  Prefer platform collectors or OpenTelemetry exporters when available.

---

### 6) Testing

- $1
- Coverage: `deno test --coverage=coverage`.
- Keep unit tests fast and deterministic; fake I/O; avoid relying on real
  network/FS unless the test is explicitly integration-level.
- Use **permission scoping** for tests (see §7) to ensure isolation and
  repeatability.
- Prefer black-box tests against public APIs over tests coupled to private
  details.

---

### 7) Permissions & security (Deno)

- **Secure by default**: deny FS/net/env/run access unless explicitly granted.
- Define **named permission sets** in `deno.json(c)` and opt into them via CLI
  flags. Avoid `-A` in CI/prod.
- Scope permissions narrowly (paths, hostnames, specific executables).
- Consider enabling **permission prompts/audit** in dev and policy files in CI.
- Ensure logs and errors never leak secrets/PII; redact before emission.

**Example (illustrative):**

```jsonc
{
  "permissions": {
    "default": { "read": ["./config/"] },
    "tests": { "read": ["./"], "env": true }
  }
}
```

### 8) Examples

**CQS naming:**

```ts
// queries
export async function getInvoicesByMonth(
  customerId: string,
  month: string,
): Promise<Invoice[]> {/* ... */}
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  /* ... */
}

// commands
export async function createInvoice(draft: InvoiceDraft): Promise<InvoiceId> {
  /* ... */
}
export async function updateUserPermissions(
  userId: string,
  patch: PermissionsPatch,
): Promise<void> {/* ... */}
```

**Error handling (result-first + throw variant):**

```ts
export class ParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParsingError";
  }
}

export function parseMonth(raw: string): Month | ParsingError {
  /* ... */
}

export function parseMonthOrThrow(raw: string): Month {
  const result = parseMonth(raw);
  if (result instanceof ParsingError) throw result;
  return result;
}
```

---

## Project specificities

**Scope & precedence.** This section overrides any previous section (Behavior
and Technical stack) where there is a conflict. If silent on a topic, previous
sections apply unchanged.

### 1) Type casting policy (ExplicitCast)

- Use the local helper **`ExplicitCast`** (`~/core/common/explicit_cast.ts`) to
  isolate and justify casts:
  - `ExplicitCast.unknown(value)` to force treating dynamic values (e.g.,
    `JSON.parse`) as `unknown`.
  - `ExplicitCast.from<T>(value).cast()` for type-safe casts (with `T`
    documenting the assumed source type).
  - `ExplicitCast.from<T>(value).dangerousCast<TResult>()` only as a last resort
    (e.g., incremental object construction).
- Isolate unavoidable casts in tiny helpers with a one-line justification.

### 2) Dev loop & CI

- Local loop tasks (declared in `deno.json(c)`):
  - `deno task fmt` → formatting
  - `deno task lint` → type checking & linting
  - `deno task test` → tests
  - `deno task dev` → run the tool without having to compile it first
  - `deno task finalize` → fmt + lint + test + compile (run before committing)
- CI is **blocking** on fmt/lint/check/tests.
- Prefer permissioned tasks (named `-P` sets) in dev/test/compile.

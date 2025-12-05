# Architecture

## Overview

GIAC follows a **hexagonal architecture** (ports & adapters), ensuring domain
logic remains independent of infrastructure details. The codebase is organized
into three main layers:

1. **Core** (`core/`) — domain entities, application services, and port
   definitions
2. **Adapters** (`adapters/`) — inbound (CLI) and outbound (YAML, filesystem)
   implementations
3. **Composition root** (`mod.ts`) — dependency injection and application
   bootstrap

---

## Directory structure

```
giac/
├── mod.ts                    # composition root & main entrypoint
├── deno.jsonc                # Deno config, tasks, import map, permissions
├── spec.yml                  # YAML specification (axes, levels, fragments)
├── AGENTS.md                 # behavioral rules for AI agents
├── GLOSSARY.md               # domain terms (accepted non-English words)
│
├── core/                     # domain + application layers (pure logic)
│   ├── domain/               # entities, value objects, domain errors
│   │   ├── axis.ts           # Axis (domain concept), Level definitions
│   │   ├── profile.ts        # Profile (collection of selected levels)
│   │   ├── prompt.ts         # Prompt (built from profile + fragments)
│   │   ├── spec.ts           # Spec (parsed YAML → domain model)
│   │   ├── errors.ts         # domain-specific errors
│   │   └── mod.ts            # public domain API
│   │
│   ├── application/          # use cases (services) and port interfaces
│   │   ├── ports/
│   │   │   ├── in/           # inbound ports (use cases exposed to adapters)
│   │   │   │   ├── build_prompt.ts    # BuildPromptUseCase interface
│   │   │   │   ├── get_spec.ts        # GetSpecUseCase interface
│   │   │   │   └── mod.ts
│   │   │   └── out/          # outbound ports (infrastructure contracts)
│   │   │       ├── spec_reader_port.ts  # SpecReaderPort interface
│   │   │       └── mod.ts
│   │   │
│   │   └── services/         # concrete use case implementations
│   │       ├── get_spec_service.ts       # loads Spec via SpecReaderPort
│   │       ├── build_prompt_service.ts   # builds Prompt from Profile
│   │       └── mod.ts
│   │
│   └── common/               # shared utilities (type casting, helpers)
│       └── explicit_cast.ts  # ExplicitCast utility (safe type coercion)
│
├── adapters/                 # infrastructure implementations
│   ├── in/                   # inbound adapters (user-facing)
│   │   └── cli/              # CLI adapter (Deno std/cli)
│   │       ├── args.ts       # argument parsing & validation
│   │       ├── ui.ts         # console output utilities
│   │       ├── messages.ts   # i18n message catalog (flat JSON)
│   │       ├── commands/     # CLI commands (get-spec, build-prompt)
│   │       │   ├── get_spec.ts
│   │       │   └── build_prompt.ts
│   │       ├── interactive/  # interactive profile flow
│   │       │   ├── profile_flow.ts    # step-by-step axis selection
│   │       │   ├── render_preview.ts  # preview display logic
│   │       │   └── validators.ts      # user input validators
│   │       └── mod.ts        # CliAdapterImpl (wires commands to services)
│   │
│   └── out/                  # outbound adapters (infrastructure)
│       └── yaml/             # YAML file reader
│           ├── yaml_spec_adapter.ts  # implements SpecReaderPort
│           └── mod.ts
│
└── coverage/                 # test coverage reports (Deno test artifacts)
```

---

## Layer responsibilities

### 1. Domain (`core/domain/`)

- **Pure business logic**: entities, value objects, invariants
- **No dependencies** on infrastructure or frameworks
- **Errors**: custom domain errors (e.g., `InvalidProfileError`,
  `SpecValidationError`)
- **Exports**:
  - `Axis`, `Level`, `AxisId`
  - `Profile`, `ProfileData`
  - `Prompt`, `PromptFragment`
  - `Spec` (validated specification)

### 2. Application (`core/application/`)

#### Ports (`ports/`)

- **Inbound ports** (`in/`): interfaces defining use cases exposed to adapters
  - `GetSpecUseCase`: loads and validates YAML spec
  - `BuildPromptUseCase`: builds prompt from profile
- **Outbound ports** (`out/`): interfaces for infrastructure dependencies
  - `SpecReaderPort`: contract for reading spec files (implemented by
    `YamlSpecAdapter`)

#### Services (`services/`)

- **Concrete implementations** of inbound use cases
- **Orchestrate domain logic** and outbound ports
- Examples:
  - `GetSpecService`: calls `SpecReaderPort.read()`, then parses/validates into
    `Spec`
  - `BuildPromptService`: takes a `Profile`, applies arbitration rules, returns
    `Prompt`

### 3. Adapters (`adapters/`)

#### Inbound (`in/cli/`)

- **CLI adapter**: user-facing interface (commands, interactive flow)
- **Responsibilities**:
  - parse CLI arguments (`args.ts`)
  - route to appropriate use case (`commands/`)
  - interactive profile builder (`interactive/profile_flow.ts`)
  - render output (`ui.ts`, `messages.ts` for i18n)
- **Wiring**: `CliAdapterImpl` receives use case instances via constructor
  injection

#### Outbound (`out/yaml/`)

- **YAML adapter**: implements `SpecReaderPort`
- **Reads** `spec.yml`, validates structure, returns raw data for domain parsing
- **Isolates** filesystem access from domain

---

## Data flow (example: build prompt)

```
User CLI command
     ↓
CliAdapterImpl.run()
     ↓
commands/build_prompt.ts
     ↓
BuildPromptUseCase.execute()  ← inbound port
     ↓
BuildPromptService            ← service implementation
     ↓
Domain logic (Profile → Prompt)
     ↓
Return Prompt to CLI
     ↓
Render & display
```

---

## Dependency rules

1. **Domain** depends on nothing (pure TypeScript types)
2. **Application** depends only on domain
3. **Adapters** depend on application ports (never on other adapters)
4. **Composition root** (`mod.ts`) wires everything together

---

## Testing strategy

- **Unit tests** (`.test.ts` files colocated with source)
  - Domain: pure logic (axis, profile, spec parsing)
  - Services: mocked ports
  - CLI: mocked services
- **Integration tests**: full CLI flow with real YAML adapter
- **Coverage**: `deno task test` generates reports in `coverage/`

---

## Key design patterns

- **Hexagonal architecture**: domain isolated from infrastructure
- **Dependency inversion**: high-level modules (services) depend on abstractions
  (ports), not concrete implementations
- **Command–Query Separation** (CQS): use cases are either commands (mutate
  state) or queries (return data)
- **Result-first error handling**: prefer returning error types over throwing
  (see `ExplicitCast` for type safety)

---

## Configuration & runtime

- **`deno.jsonc`**: tasks, import map, permissions
- **`spec.yml`**: single source of truth for axes, levels, fragments
- **No global state**: config passed explicitly through dependency injection
- **Permissions**: scoped to read (`./spec.yml`, `./config/`) in prod; broader
  in tests

---

## Extension points

- **Add a new inbound adapter**: implement inbound use case interfaces (e.g.,
  HTTP API, TUI)
- **Add a new outbound adapter**: implement `SpecReaderPort` (e.g., remote API,
  database)
- **Add a new use case**: define interface in `ports/in/`, implement in
  `services/`, wire in composition root

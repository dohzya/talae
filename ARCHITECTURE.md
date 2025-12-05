# Architecture

## Overview

TALAE is a chat application where users converse with AI-powered characters
living in persistent fictional universes. The project follows a **hexagonal
architecture** (ports & adapters), ensuring domain logic remains independent of
infrastructure. The codebase is organized as a Deno monorepo with three
workspace members:

1. **Core** (`packages/core/`) — domain entities, ports, and application
   services
2. **Backend** (`apps/backend/`) — Hono API server with adapters
3. **Frontend** (`apps/frontend/`) — Fresh 2 web interface with Vite

---

## Directory structure

```
talae/
├── deno.jsonc                # workspace root configuration
├── .env                      # committed defaults (Ollama, DB path)
├── .env.example              # environment documentation
├── data/                     # database storage (gitignored)
│   └── talae.db             # Deno KV database
│
├── packages/
│   └── core/                 # domain & application (pure logic)
│       ├── mod.ts            # public API exports
│       ├── domain/           # entities & value objects
│       │   ├── user.ts
│       │   ├── universe.ts
│       │   ├── character.ts
│       │   ├── conversation.ts
│       │   ├── message.ts
│       │   └── memory.ts
│       ├── application/
│       │   ├── ports/        # infrastructure contracts
│       │   │   ├── database_port.ts
│       │   │   └── llm_port.ts
│       │   └── services/     # use case implementations
│       │       ├── evolve_world_service.ts
│       │       └── generate_response_service.ts
│       ├── config/
│       │   └── env_config.ts # Zod-validated environment
│       └── common/
│           └── explicit_cast.ts
│
├── apps/
│   ├── backend/
│   │   ├── deno.jsonc        # backend configuration
│   │   ├── main.ts           # server entrypoint
│   │   ├── app.ts            # Hono app setup
│   │   ├── routes/
│   │   │   └── universe_routes.ts  # REST + SSE endpoints
│   │   └── adapters/
│   │       ├── persistence/
│   │       │   └── deno_kv_adapter.ts
│   │       └── llm/
│   │           ├── ollama_adapter.ts
│   │           ├── ollama_client.ts
│   │           └── openai_adapter.ts
│   │
│   └── frontend/
│       ├── deno.json         # frontend configuration
│       ├── vite.config.ts    # Vite + Fresh plugin
│       ├── main.ts           # Fresh app entrypoint
│       ├── client.ts         # client-side entry
│       ├── utils.ts          # Fresh helpers
│       ├── routes/           # file-based routing
│       │   ├── _app.tsx      # HTML layout
│       │   ├── index.tsx     # landing page
│       │   └── universes.tsx # universe list
│       └── islands/          # client-side interactive components
│           └── ChatInterface.tsx
│
└── inspiration/              # reference code patterns (excluded from builds)
```

---

## Layer responsibilities

### 1. Domain (`packages/core/domain/`)

**Pure business logic** with no external dependencies:

- **Entities**: User, Universe, Character, Conversation, Message, Memory
- **Zod schemas**: Schema-first validation for all domain types
- **Create schemas**: `CreateUserSchema`, `CreateUniverseSchema`, etc. for
  mutations
- **Type inference**: `User = z.infer<typeof UserSchema>`
- **No infrastructure knowledge**: uses type-level constraints
  (`satisfies z.ZodType<UserId>`)

Key domain concepts:

- **Universes**: persistent fictional worlds with their own state and memories
- **Characters**: entities within universes with availability, current state,
  and memories
- **Conversations**: user–character interaction sessions
- **Messages**: timestamped utterances with role (user/character)
- **Memory entries**: salience-weighted content with tags for context retrieval

### 2. Application (`packages/core/application/`)

#### Ports (`ports/`)

Infrastructure contracts as interfaces:

- **DatabasePort**: CRUD operations for all entities
  - Namespace-scoped methods: `createUser`, `getUniverse`, `listConversations`,
    etc.
  - Returns domain types validated by Zod schemas
- **LLMPort**: language model integration
  - `generate(messages, options)`: single completion
  - `generateStream(messages, options)`: streaming responses (AsyncGenerator)
  - Generic message format:
    `{ role: "user" | "assistant" | "system", content: string }`

#### Services (`services/`)

Application logic orchestrating domain and ports:

- **EvolveWorldService**: updates universe state over time
  - Retrieves universe and its characters
  - Uses LLM to generate new state based on elapsed time
  - Persists evolved state
- **GenerateResponseService**: produces character responses in conversation
  - Loads conversation, character, universe context
  - Constructs system prompt with character personality and world state
  - Streams LLM response with character's voice
  - Stores response as new message

### 3. Backend (`apps/backend/`)

#### Routes (`routes/universe_routes.ts`)

RESTful API with universe-scoped endpoints:

```
GET    /api/universe/:univId
GET    /api/universe/:univId/conversations
POST   /api/universe/:univId/conversations
GET    /api/universe/:univId/conversations/:convId
GET    /api/universe/:univId/conversations/:convId/messages
POST   /api/universe/:univId/conversations/:convId/messages
GET    /api/universe/:univId/conversations/:convId/stream
```

**SSE streaming endpoint** (`/stream`):

- Server-Sent Events for real-time character responses
- Stores user message
- Invokes `GenerateResponseService` with streaming
- Emits chunks as `data: {chunk}\n\n`
- Stores complete character response

#### Adapters

**Persistence** (`adapters/persistence/deno_kv_adapter.ts`):

- Implements `DatabasePort`
- Uses Deno KV for persistence
- Key patterns: `["users", userId]`, `["universes", univId]`, etc.
- Validates all data with Zod schemas on read

**LLM** (`adapters/llm/`):

- **OllamaAdapter**: local Ollama integration (default: `ministral-3:8b`)
  - Implements `LLMPort` with streaming via fetch
  - Handles `exactOptionalPropertyTypes` by conditionally building options
- **OpenAIAdapter**: OpenAI-compatible API
  - Same interface, different HTTP client
  - Supports streaming via SSE parsing

### 4. Frontend (`apps/frontend/`)

**Fresh 2.2 with Vite**:

- File-based routing in `routes/`
- Server-rendered pages with optional client islands
- Tailwind CSS via CDN for styling

**Routes**:

- `index.tsx`: landing page with TALAE introduction
- `universes.tsx`: list of available universes
- `_app.tsx`: HTML layout wrapper

**Islands** (`islands/ChatInterface.tsx`):

- Client-side interactive component using Preact signals
- Connects to backend SSE endpoint for streaming responses
- Displays message history with user/character distinction
- Real-time message updates during streaming

---

## Data flow (example: send message)

```
User types message in ChatInterface
     ↓
POST /api/universe/:univId/conversations/:convId/messages
     ↓
universe_routes.ts handler
     ↓
1. Validate request body (Zod CreateMessageSchema)
2. Store user message (DatabasePort)
     ↓
SSE connection to /stream endpoint
     ↓
GenerateResponseService.execute()
     ↓
┌─── Service orchestration ────────┐
│ 1. Load conversation              │
│ 2. Load character & universe      │
│ 3. Construct system prompt        │
│ 4. Load recent messages           │
│ 5. Call LLM with streaming        │
│    (via LLMPort.generateStream()) │
│ 6. For each chunk:                │
│    - Append to response buffer    │
│    - Yield to SSE stream          │
│ 7. Store complete character msg   │
└───────────────────────────────────┘
     ↓
Stream chunks via SSE: data: {chunk}\n\n
     ↓
ChatInterface receives chunks
     ↓
Update UI with streaming text
```

---

## Dependency rules

1. **Domain** has zero dependencies (pure TypeScript + Zod)
2. **Application** depends only on domain types and port interfaces
3. **Adapters** depend on ports, never on other adapters
4. **Routes** depend on application services and adapters (injected)
5. **Frontend** calls backend API, never accesses domain directly

**Inversion of control**: `main.ts` creates adapters and injects them into
services and routes.

---

## Configuration & runtime

### Environment (`packages/core/config/env_config.ts`)

Zod-validated configuration with defaults:

```typescript
EnvConfigSchema = z.object({
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("ministral-3:8b"),
  LLM_PROVIDER: z.enum(["ollama", "openai"]).default("ollama"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional().default("gpt-4o-mini"),
  DATABASE_PATH: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default(
    "development",
  ),
});
```

**Committed `.env`** with sensible defaults (no `.env.local` required for dev):

```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=ministral-3:8b
LLM_PROVIDER=ollama
DATABASE_PATH=data/talae.db
NODE_ENV=development
```

### Backend startup (`apps/backend/main.ts`)

1. Load and validate environment config
2. Resolve database path relative to project root
3. Initialize Deno KV adapter
4. Initialize LLM adapter (Ollama or OpenAI based on config)
5. Create Hono app with injected dependencies
6. Start server on port from `PORT` env var (default: 8000)

### Frontend startup (`apps/frontend/main.ts`)

1. Create Fresh app instance
2. Register static files middleware
3. Discover and mount file-based routes with `app.fsRoutes()`
4. Vite handles dev server and HMR

---

## Key design patterns

### Hexagonal architecture

- **Domain** is the center: pure business logic
- **Application** defines contracts (ports) and orchestrates domain
- **Adapters** implement ports, isolated from each other
- **Dependency direction**: always points inward (adapters → application →
  domain)

### Schema-first validation

- **All external boundaries** validated with Zod
- **Domain types** derived from schemas:
  `type User = z.infer<typeof UserSchema>`
- **Create types** for mutations:
  `CreateUserSchema = UserSchema.omit({ id: true, createdAt: true })`
- **Runtime safety**: parse at edges, work with typed data internally

### Command–Query Separation (CQS)

Enforced in method naming:

- **Commands** (mutate): `createUser`, `updateCharacter`, `storeMessage`
- **Queries** (read): `getUniverse`, `listConversations`, `findCharacter`
- **No mixed operations**: a method either changes state OR returns data, not
  both

### ExplicitCast pattern

Isolated type coercion with justification:

```typescript
ExplicitCast.unknown(value); // Force unknown for dynamic values
ExplicitCast.from<T>(value).cast(); // Type-safe cast
ExplicitCast.from<T>(value).dangerousCast<R>(); // Last resort
```

Used for:

- JSON.parse results
- Incremental object construction
- Integration with untyped APIs

### Streaming with AsyncGenerator

LLM responses stream via `AsyncGenerator<string>`:

```typescript
async function* generateStream(messages): AsyncGenerator<string> {
  for await (const chunk of response) {
    yield chunk;
  }
}
```

Consumed by:

- SSE endpoints (yield to HTTP stream)
- Services (accumulate and store)

---

## Testing strategy

- **No tests yet** (project initialization phase)
- **Planned approach**:
  - Unit tests for domain logic (colocated `.test.ts`)
  - Service tests with mocked ports
  - Adapter tests with mocked HTTP clients or in-memory KV
  - Integration tests for routes
- **Tasks**:
  - `deno task fmt` — format code
  - `deno task lint` — lint (no-slow-types excluded)
  - `deno task check` — type check core + backend
  - `deno task finalize` — fmt + lint + check
  - `deno task dev:backend` — start backend with watch
  - `deno task dev:frontend` — start Vite dev server

---

## Key algorithms

### Character response generation

1. **Context loading**:
   - Retrieve conversation, character, universe
   - Load recent messages from conversation
2. **Prompt construction**:
   - System message: character personality, current state, universe context
   - Conversation history: recent messages with roles
3. **LLM streaming**:
   - Call `LLMPort.generateStream()` with constructed context
   - Stream chunks to client via SSE
   - Accumulate full response in memory
4. **Persistence**:
   - Store complete character message in conversation
   - Update conversation's `lastMessageAt` timestamp

### Universe evolution (not yet implemented)

Planned algorithm:

1. Calculate time elapsed since `lastEvolvedAt`
2. Load universe state and all characters
3. Generate evolution prompt describing changes over time
4. Use LLM to produce new universe state and character states
5. Update memories, character availability, world events
6. Persist evolved state with new timestamp

---

## Extension points

- **Add new LLM provider**: implement `LLMPort`, add to adapter factory in
  `main.ts`
- **Add new database**: implement `DatabasePort` (e.g., PostgreSQL, MongoDB)
- **Add authentication**: wrap routes with middleware, add User context
- **Add new entity types**: define domain schema, add CRUD to `DatabasePort`,
  create service
- **Add WebSocket support**: alternative to SSE for bidirectional communication
- **Add memory search**: implement vector embeddings for semantic memory
  retrieval

---

## Development workflow

1. **Start backend**: `PORT=8001 deno task dev:backend`
2. **Start frontend**: `deno task dev:frontend` (runs on port 5173)
3. **Format code**: `deno task fmt`
4. **Check quality**: `deno task finalize` before committing
5. **Database**: stored at `data/talae.db` (auto-created on first run)

**Prerequisites**:

- Deno 2.x installed
- Ollama running locally (or configure OpenAI API key)
- Ollama model pulled: `ollama pull ministral-3:8b`

---

## Key dependencies

- **Runtime**: Deno 2.x with workspace support
- **Backend**:
  - `jsr:@hono/hono@^4` — fast web framework
  - `jsr:@zod/zod@^4` — schema validation
  - Deno KV (built-in, requires `--unstable-kv` flag)
- **Frontend**:
  - `jsr:@fresh/core@^2.2` — Fresh framework
  - `npm:preact@^10.27` — lightweight React alternative
  - `npm:@preact/signals@^2.5` — reactive state
  - `npm:vite@^7.2` — build tool and dev server
  - `jsr:@fresh/plugin-vite@^1.0` — Fresh–Vite integration
- **Development**:
  - Tailwind CSS (via CDN for rapid prototyping)
  - Native Deno formatter, linter, type checker

---

## Architecture decisions

### Why hexagonal?

- **Testability**: domain logic isolated, easy to test without infrastructure
- **Flexibility**: swap databases, LLM providers, or frontends without changing
  domain
- **Clarity**: explicit contracts (ports) show what the application needs

### Why Zod everywhere?

- **Type safety at boundaries**: validate external input before it enters the
  system
- **Single source of truth**: schemas define both runtime validation and
  TypeScript types
- **Error messages**: Zod provides clear validation errors for debugging

### Why Deno KV?

- **Built-in**: no external database setup for development
- **Persistence**: file-based storage for production readiness
- **Simple**: key-value model fits our access patterns (get by ID, list by
  prefix)

### Why Ollama default?

- **Local-first**: no API keys required for basic usage
- **Privacy**: conversations stay on your machine
- **Performance**: fast inference with quantized models like `ministral-3:8b`
- **Flexibility**: easy to swap for OpenAI/Anthropic in production

### Why Fresh 2 + Vite?

- **Modern DX**: Vite provides fast HMR and excellent TypeScript support
- **Islands architecture**: server-render by default, hydrate only interactive
  components
- **File-based routing**: intuitive organization, automatic code splitting
- **Fresh 2.2**: latest stable release with improved Vite integration

### Why monorepo?

- **Shared types**: core domain used by both backend and frontend
- **Atomic changes**: update domain schema once, impacts both consumers
- **Simplified tooling**: single `deno task finalize` checks entire codebase
- **Workspace features**: Deno 2 natively supports monorepos with isolated tasks

# TALAE

**Talking Avatar in a Living Artificial Environment**

A chat application where you converse with characters living in persistent
fictional universes.

## Architecture

This is a Deno monorepo with three workspace members:

- **`packages/core`**: Shared domain logic, entities, ports, and services
- **`apps/backend`**: Hono API server with Deno KV persistence and LLM
  integration
- **`apps/frontend`**: Fresh 2 web UI with streaming chat interface

### Key Features

- 🌍 **Persistent Universes**: Each universe has evolving state between
  conversations
- 💭 **Character Memory**: Characters remember interactions using salience-based
  retrieval
- ⏱️ **Real-Time**: 1:1 time model with character availability
- 💬 **Dialogued Conversations**: First-person character responses (no
  narration)
- 🔄 **Streaming**: SSE-based streaming for real-time character responses
- 🎯 **Hexagonal Architecture**: Clean separation between domain, application,
  and adapters

## Prerequisites

- **Deno 2.x** (install via `mise` or [deno.land](https://deno.land))
- **Ollama** (for local LLM): `brew install ollama` or see
  [ollama.com](https://ollama.com)
- **ministral-3:8b model**: `ollama pull ministral-3:8b`

## Quick Start

### 1. Install Dependencies

```fish
# Install Deno if using mise
mise install

# Pull Ollama model
ollama pull ministral-3:8b
```

### 2. Start Ollama (in a separate terminal)

```fish
ollama serve
```

### 3. Run Backend

```fish
deno task dev:backend
```

Backend runs at `http://localhost:8000`

### 4. Run Frontend (in another terminal)

```fish
deno task dev:frontend
```

Frontend runs at `http://localhost:8080`

## Configuration

### Environment Variables

The app uses `.env` (committed) for defaults and `.env.local` (gitignored) for
secrets.

**Default config (`.env`):**

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=ministral-3:8b
LLM_PROVIDER=ollama
DATABASE_PATH=./data/talae.db
NODE_ENV=development
```

**To use OpenAI instead:**

Create `.env.local`:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## Development

### Available Tasks

Root-level tasks:

```fish
deno task check          # Type check all workspaces
deno task fmt            # Format code
deno task lint           # Lint code
deno task test           # Run tests
deno task finalize       # fmt + lint + check + test (run before commit)
deno task dev:backend    # Start backend server
deno task dev:frontend   # Start frontend server
```

Package-specific tasks:

```fish
cd packages/core && deno task test
cd apps/backend && deno task dev
cd apps/frontend && deno task dev
```

## API Routes

### Universe-Scoped Endpoints

```
GET    /api/universe/:univId
GET    /api/universe/:univId/conversations
POST   /api/universe/:univId/conversations
GET    /api/universe/:univId/conversations/:convId
GET    /api/universe/:univId/conversations/:convId/messages
POST   /api/universe/:univId/conversations/:convId/messages
POST   /api/universe/:univId/conversations/:convId/stream (SSE)
```

### Example: Send Message with Streaming Response

```typescript
const response = await fetch(
  "http://localhost:8000/api/universe/{univId}/conversations/{convId}/stream",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId: convId,
      role: "user",
      content: "Hello!",
    }),
  },
);

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Process SSE data...
}
```

## Project Structure

```
.
├── deno.json                    # Root workspace config
├── .env                         # Default environment (committed)
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── SPEC.md                      # Project specification
├── AGENTS.md                    # Development guidelines
│
├── packages/core/               # Shared domain logic
│   ├── deno.jsonc
│   ├── mod.ts                   # Public API
│   ├── domain/                  # Entities & schemas
│   │   ├── user.ts
│   │   ├── universe.ts
│   │   ├── character.ts
│   │   ├── conversation.ts
│   │   ├── message.ts
│   │   └── memory.ts
│   ├── application/
│   │   ├── ports/out/           # Outbound port interfaces
│   │   │   ├── database_port.ts
│   │   │   └── llm_port.ts
│   │   └── services/            # Use case implementations
│   │       ├── evolve_world_service.ts
│   │       └── generate_response_service.ts
│   ├── config/
│   │   └── env_config.ts        # Environment validation
│   └── common/
│       └── explicit_cast.ts     # Type casting utilities
│
├── apps/backend/                # Hono API server
│   ├── deno.jsonc
│   ├── main.ts                  # Server entrypoint
│   ├── app.ts                   # Hono app setup
│   ├── routes/
│   │   └── universe_routes.ts  # Universe-scoped routes
│   └── adapters/
│       ├── persistence/
│       │   └── deno_kv_adapter.ts
│       └── llm/
│           ├── ollama_client.ts
│           ├── ollama_adapter.ts
│           └── openai_adapter.ts
│
└── apps/frontend/               # Fresh 2 web UI
    ├── deno.json
    ├── main.ts                  # Fresh entrypoint
    ├── routes/
    │   ├── _app.tsx             # HTML layout
    │   ├── index.tsx            # Landing page
    │   └── universes.tsx        # Universe list
    └── islands/
        └── ChatInterface.tsx    # Interactive chat
```

## Tech Stack

- **Runtime**: Deno 2.x
- **Backend**: Hono (fast web framework)
- **Frontend**: Fresh 2 (Preact-based SSR/islands)
- **Database**: Deno KV (built-in key-value store)
- **LLM**: Ollama (local) or OpenAI (cloud)
- **Validation**: Zod (schema-first validation)
- **Styling**: Tailwind CSS (via CDN)

## Design Principles (from AGENTS.md)

1. **Explicit > Implicit**: No magic, predictable behavior
2. **Command-Query Separation**: Commands mutate, queries observe
3. **Result-First Error Handling**: Return errors, don't throw (when feasible)
4. **Schema-First Validation**: Validate at boundaries with Zod
5. **Hexagonal Architecture**: Domain ← Application → Adapters
6. **English-Only**: All code, comments, and identifiers in US English
7. **Underscore Naming**: `user_service.ts` not `user-service.ts`

## Next Steps

### MVP Features to Implement

- [ ] User authentication & sessions
- [ ] Universe CRUD operations
- [ ] Character CRUD operations
- [ ] RAG-based memory retrieval (semantic search)
- [ ] World evolution trigger (before processing messages)
- [ ] Character availability system
- [ ] Offline message handling

### Future Enhancements

- [ ] PostgreSQL adapter for production
- [ ] Vector database for memory (Pinecone/Weaviate)
- [ ] Anthropic Claude adapter
- [ ] Time acceleration modes
- [ ] Complex character scheduling
- [ ] Multi-character conversations

## Contributing

Before committing, run:

```fish
deno task finalize
```

This ensures formatting, linting, type checking, and tests pass.

## License

TBD

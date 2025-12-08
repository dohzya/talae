# TODO

## MVP Features to Implement

- [ ] **User authentication & sessions**
  - Not implemented
  - Only basic user CRUD exists (`createUser`/`getUser` in DatabasePort)
  - No login/auth logic or session management

- [/] **Universe CRUD operations**
  - Partially implemented
  - `getUniverse`, `listUniverses`, `updateUniverse` work
  - `createUniverse` exists in DatabasePort but no public API route
  - No delete operation

- [/] **Character CRUD operations**
  - Partially implemented
  - `createCharacter`, `getCharacter`, `listCharacters`, `updateCharacter` exist in DatabasePort and used internally (seed.ts)
  - `listCharacters` has API route (`GET /api/universe/:univId/characters`)
  - No public create/update/delete routes

- [ ] **RAG-based memory retrieval (semantic search)**
  - Not implemented
  - Memory uses simple salience-based sorting (top 10 by salience score)
  - No vector embeddings, no semantic search, no RAG

- [/] **World evolution trigger**
  - Partially implemented
  - `evolve_world_service.ts` exists in `packages/core/application/services/` with full business logic
  - Never called from message processing pipeline (step 3 from SPEC.md missing in `universe_routes.ts` stream endpoint)

- [/] **Character availability system**
  - Partially implemented
  - Domain model supports it (`isAvailableAt`, `nextAvailableAt` in Character entity)
  - Characters have availability stored in database
  - Frontend displays availability status
  - Not enforced during message processing — no check before generating response in stream endpoint

- [ ] **Offline message handling**
  - Not implemented
  - No queue for messages when character unavailable
  - No delayed response mechanism
  - SPEC.md describes it but code doesn't implement it

## Future Enhancements

- [ ] PostgreSQL adapter for production
- [ ] Vector database for memory (Pinecone/Weaviate)
- [ ] Anthropic Claude adapter
- [ ] Time acceleration modes
- [ ] Complex character scheduling
- [ ] Multi-character conversations

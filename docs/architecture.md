# Architecture

## Current System Shape
- The app uses Next.js App Router with domain logic in `features/pokedex`.
- The runtime is hybrid:
  - list and detail catalog reads are DB-backed
  - daily and collection routes still read the local snapshot
- User-owned collection state is still browser-local.

## High-Level Structure
- `app/`
  - route entry points and layout
- `features/pokedex/`
  - domain types, constants, UI, utilities, and server data access
- `features/site/`
  - reusable site-level shells and header UI
- `features/theme/`
  - theme toggle UI
- `data/pokedex.json`
  - generated catalog snapshot
- `scripts/sync-pokedex.mjs`
  - snapshot generation from PokeAPI
- `scripts/import-pokedex-to-db.mjs`
  - snapshot import into PostgreSQL
- `lib/db/`
  - shared DB client
- `db/schema/`
  - Drizzle schema definitions

## Runtime Data Flow

### List Routes
1. `app/page.tsx` and `app/pokedex/page.tsx` parse route search params
2. `features/pokedex/server/list-page.ts` normalizes query input
3. `features/pokedex/server/repository.ts#getPokedexListPage()` queries `pokemon_catalog`
4. `PokedexPage` receives already paginated list data plus server list state
5. Client controls update the URL query string and trigger a new server fetch

### Detail Route
1. `app/pokemon/[slug]/page.tsx` loads the slug
2. `features/pokedex/server/repository.ts#getPokemonDetailBySlug()` queries `pokemon_catalog`
3. Adjacent navigation is loaded from the same catalog snapshot in PostgreSQL
4. `PokemonDetailPage` renders the full detail experience

### Daily And Collection Routes
1. `app/daily/page.tsx` and `app/my-pokemon/page.tsx` call `getPokedexSnapshot()`
2. `features/pokedex/server/repository.ts#getPokedexSnapshot()` reads `data/pokedex.json`
3. `PokedexPage` runs local collection logic in the browser
4. Collection state is stored in `localStorage`

## Catalog Data Pipeline
1. `scripts/sync-pokedex.mjs` fetches from PokeAPI
2. The script writes `data/pokedex.json`
3. `scripts/import-pokedex-to-db.mjs` imports that snapshot into PostgreSQL
4. Runtime list/detail reads use the imported catalog tables

## Data Contracts
- `features/pokedex/types.ts` defines the stable payload contracts used by both snapshot and DB payload storage.
- `pokemon_catalog.payload` stores a full `PokemonSummary`-shaped object.
- `pokedex_snapshots.payload` stores the full snapshot payload.

## Current Architectural Risks
- Mixed read paths:
  - runtime behavior differs by route
- Environment dependency:
  - `lib/db/client.ts` requires `DATABASE_URL`
- Catalog duplication:
  - the same catalog exists in both `data/pokedex.json` and PostgreSQL
- User-state split:
  - collection progress is separate from server-backed catalog reads
- Doc drift:
  - architecture can become misleading unless runtime-path changes are documented immediately

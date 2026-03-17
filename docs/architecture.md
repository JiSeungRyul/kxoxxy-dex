# Architecture

## Current System Shape
- The app uses Next.js App Router with domain logic in `features/pokedex`.
- The runtime is hybrid:
  - list, detail, daily, and my-pokemon catalog reads are DB-backed
  - snapshot generation and DB import still coexist in the data pipeline
- Daily encounter and collection state, including shiny flags, are stored per anonymous session in PostgreSQL.
- The client still mirrors collection state into `localStorage` as a compatibility fallback.

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
1. `app/daily/page.tsx` loads the full Pokemon catalog from PostgreSQL
2. The client creates or reuses an anonymous session id in local storage
3. `app/api/daily/state/route.ts` reads and writes anonymous-session daily state through PostgreSQL
4. `app/my-pokemon/page.tsx` also loads the full Pokemon catalog from PostgreSQL
5. `PokedexPage` loads collection state from the same anonymous-session API for both `/daily` and `/my-pokemon`
6. The client mirrors the returned state into `localStorage` as a fallback and compatibility layer

## Catalog Data Pipeline
1. `scripts/sync-pokedex.mjs` fetches from PokeAPI
2. The script writes `data/pokedex.json`
3. `scripts/import-pokedex-to-db.mjs` imports that snapshot into PostgreSQL
4. Runtime list/detail/daily catalog reads use the imported catalog tables

## Data Contracts
- `features/pokedex/types.ts` defines the stable payload contracts used by both snapshot and DB payload storage.
- `pokemon_catalog.payload` stores a full `PokemonSummary`-shaped object.
- `pokedex_snapshots.payload` stores the full snapshot payload.

## Current Architectural Risks
- Mixed read paths:
  - runtime behavior differs by route
- Environment dependency:
  - `lib/db/client.ts` requires `DATABASE_URL`
- Migration dependency:
  - `anonymous_sessions`, `daily_encounters`, and `daily_captures` must exist before the daily and My Pokemon collection flow can succeed
- Catalog duplication:
  - the same catalog exists in both `data/pokedex.json` and PostgreSQL
- User-state split:
  - anonymous server persistence exists, but account-linked user persistence does not
- Doc drift:
  - architecture can become misleading unless runtime-path changes are documented immediately

## Immediate Follow-Up TODO
- Replace browser-generated anonymous session handling with a stronger server-managed session boundary when auth work begins.
- Add a lightweight verification flow for daily state after migrations and server restarts.

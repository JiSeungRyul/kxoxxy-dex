# Architecture

## Current System Shape
- The app uses Next.js App Router with domain logic in `features/pokedex`.
- The runtime is hybrid:
  - list, detail, daily, and my-pokemon catalog reads are DB-backed
  - snapshot generation and DB import still coexist in the data pipeline
- Daily encounter, collection state, and saved team data are stored per anonymous session in PostgreSQL.
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
1. `app/daily/page.tsx` loads a collection-specific reduced catalog payload from PostgreSQL through `getPokedexCollectionCatalogSnapshot()`
2. The client creates or reuses an anonymous session id in local storage
3. `app/api/daily/state/route.ts` reads and writes anonymous-session daily state through PostgreSQL
4. `app/my-pokemon/page.tsx` loads a slimmer collection-gallery payload from PostgreSQL that omits daily-only fields such as generation and stats
5. `PokedexPage` loads collection state from the same anonymous-session API for both `/daily` and `/my-pokemon`
6. The client mirrors the returned state into `localStorage` as a fallback and compatibility layer

### Team Routes
1. `app/teams/page.tsx` loads a team-builder-specific reduced catalog payload from PostgreSQL through `getPokedexTeamBuilderCatalogSnapshot()`
2. The client creates or reuses the same anonymous session id used by daily and collection flows
3. `app/api/teams/state/route.ts` reads and writes team and team-member rows through PostgreSQL
4. `app/my-teams/page.tsx` reads the saved team list for the current anonymous session
5. Team member detail views join saved member configuration with the latest `pokemon_catalog.payload` snapshot and compute level-based battle stats in the client

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
  - `anonymous_sessions`, `daily_encounters`, `daily_captures`, `teams`, and `team_members` must exist before the daily, My Pokemon, and team-builder flows can succeed
- Catalog duplication:
  - the same catalog exists in both `data/pokedex.json` and PostgreSQL
- User-state split:
  - anonymous server persistence exists, but account-linked user persistence does not
- Doc drift:
  - architecture can become misleading unless runtime-path changes are documented immediately

## Immediate Follow-Up TODO
- Replace browser-generated anonymous session handling with a stronger server-managed session boundary when auth work begins.
- Add a lightweight verification flow for daily and team state after migrations and server restarts.
- Continue reducing the remaining initial route payload on `/daily`, `/my-pokemon`, and `/teams`.
  - A reduced catalog-list payload shipped on 2026-03-24, replacing the previous full `PokemonSummary` route payload for those pages.
  - On 2026-03-25, the shared reduced payload was split again so `/daily` and `/my-pokemon` no longer receive team-builder ability data, and `/teams` no longer receives collection-only fields such as slugs, generation, and shiny image variants.
  - In a follow-up step, `/my-pokemon` was slimmed further so it no longer receives daily-only fields such as generation and stats.
  - Local `npm run start` measurement on 2026-03-24 showed second-request totals of about 0.052s for `/daily`, 0.040s for `/my-pokemon`, and 0.031s for `/teams`.
  - The same production responses still returned large payloads at roughly 1.10 MB to 1.11 MB per route, so the remaining bottleneck is transfer size more than server time.
  - Local `npm run dev` measurement on 2026-03-24 remained much slower at about 13.50s for `/daily`, 10.60s for `/my-pokemon`, and 4.70s for `/teams` on second request.
- Rework catalog delivery for the daily, collection, and team-builder routes so they do not ship broad catalog data to the client on first load.
  - Prefer route-specific payloads or smaller server-derived view models over broad refactors.
  - Keep `app/` thin and keep catalog shaping inside `features/pokedex/server/`.
  - Preserve the current `PokemonSummary` contract unless a deliberate schema migration is planned.
- Revisit the current caching approach for reduced and full catalog reads.
  - `unstable_cache` should be re-evaluated after payload shape changes because cache effectiveness and data-cache limits may differ by route payload size.
  - Any follow-up should verify whether cache granularity, payload shape, or route-level read strategy needs to change.
- Keep re-measuring both `npm run dev` and `npm run start` for `/`, `/daily`, `/my-pokemon`, `/teams`, `/api/daily/state`, and `/api/teams/state` after each meaningful performance change so the next improvement is explicit.


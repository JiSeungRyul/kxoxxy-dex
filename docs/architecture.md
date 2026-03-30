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
- `data/item-catalog.json`
  - generated item catalog snapshot
- `data/move-catalog.json`
  - generated move catalog snapshot
- `scripts/sync-pokedex.mjs`
  - snapshot generation from PokeAPI
- `scripts/sync-items.mjs`
  - item snapshot generation from PokeAPI
- `scripts/sync-moves.mjs`
  - move snapshot generation from PokeAPI plus per-Pokemon learnset extraction and small local Korean-name overrides for newer moves when PokeAPI omits Korean labels
- `scripts/import-pokedex-to-db.mjs`
  - snapshot import into PostgreSQL
- `scripts/import-items-to-db.mjs`
  - item snapshot import into PostgreSQL
- `scripts/import-moves-to-db.mjs`
  - move snapshot import into PostgreSQL
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
1. `app/daily/page.tsx` loads a dex-number-only daily candidate snapshot from PostgreSQL through `getPokedexDailyDexNumberSnapshot()`
2. The client creates or reuses an anonymous session id in local storage
3. `app/api/daily/state/route.ts` reads and writes anonymous-session daily state through PostgreSQL
4. `PokedexPage` fetches encounter and recent-capture detail on demand through `app/api/pokedex/catalog/route.ts` when the daily client state is ready
5. `app/my-pokemon/page.tsx` ships no gallery catalog on first render and relies on the same anonymous-session collection state to request captured-card detail on demand through `app/api/pokedex/catalog/route.ts`
6. `PokedexPage` loads collection state from the same anonymous-session API for both `/daily` and `/my-pokemon`
7. The client mirrors the returned state into `localStorage` as a fallback and compatibility layer

### Team Routes
1. `app/teams/page.tsx` loads a small team-builder option list with dex number, Korean name, generation, and Pokedex-name metadata plus reduced item option entries from PostgreSQL through `getPokedexTeamBuilderOptionSnapshot()` and `getPokedexTeamBuilderItemOptionSnapshot()`
2. `TeamBuilderPage` fetches selected Pokemon detail on demand through `app/api/pokedex/catalog/route.ts` and selected Pokemon move options on demand through `app/api/pokedex/moves/route.ts` so the first render does not ship the full team-builder catalog or move learnset data
3. The client creates or reuses the same anonymous session id used by daily and collection flows
4. `app/api/teams/state/route.ts` reads and writes team and team-member rows through PostgreSQL
5. `app/my-teams/page.tsx` reads the saved team list for the current anonymous session
6. Team member detail views join saved member configuration with the latest `pokemon_catalog.payload` snapshot and compute level-based battle stats in the client

## Catalog Data Pipeline
1. `scripts/sync-pokedex.mjs` fetches from PokeAPI
2. The script writes `data/pokedex.json`
3. `scripts/sync-items.mjs` fetches the full PokeAPI item list and writes `data/item-catalog.json`
4. `scripts/sync-moves.mjs` fetches the full PokeAPI move list plus per-Pokemon learnset data and writes `data/move-catalog.json`
5. `scripts/import-pokedex-to-db.mjs` imports the Pokemon snapshot into PostgreSQL
6. `scripts/import-items-to-db.mjs` imports the item snapshot into PostgreSQL
7. `scripts/import-moves-to-db.mjs` imports the move snapshot and per-Pokemon learnset rows into PostgreSQL
8. Runtime list/detail/daily catalog reads use the imported Pokemon catalog tables

## Data Contracts
- `features/pokedex/types.ts` defines the stable payload contracts used by both snapshot and DB payload storage.
- `pokemon_catalog.payload` stores a full `PokemonSummary`-shaped object.
- `pokedex_snapshots.payload` stores the full snapshot payload.
- `item_catalog.payload` stores a full `PokedexItem`-shaped object.
- `item_snapshots.payload` stores the full item snapshot payload.
- `move_catalog.payload` stores a full `PokedexMove`-shaped object.
- `move_snapshots.payload` stores the full move snapshot payload.
- `pokemon_move_catalog.payload` stores a full `PokedexPokemonMove`-shaped object.

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

## Cache Strategy Review Scope (Added: 2026-03-25)

### Purpose
- Re-evaluate the current `repository.ts` cache layout after the route-specific payload split.
- Keep the current MVP behavior and user-facing flows unchanged.
- Prefer the smallest safe cache cleanup over a broader caching redesign.

### In Scope
- Review `unstable_cache` usage inside `features/pokedex/server/repository.ts`.
- Review whether the current snapshot helpers still match the first-load behavior of `/daily`, `/my-pokemon`, and `/teams`.
- Check whether dex-number snapshots, option-list snapshots, and by-dex detail reads have clear responsibilities and consistent naming.
- Remove or simplify cache helpers only when they are clearly obsolete after the payload restructuring.
- Update docs immediately when cache responsibilities or helper names change.

### Out Of Scope
- Full Next.js caching redesign.
- Route segment cache-policy redesign.
- New invalidation systems such as tag-based cache orchestration.
- Broad DB query rewrites or new abstraction layers.
- Auth- or session-aware cache invalidation work.
- Product behavior changes.

### Focus Questions
- Does each route still use the smallest cacheable server payload that matches its first render?
- Are any snapshot helpers now redundant after the on-demand catalog-detail change?
- Are by-dex detail reads intentionally uncached, or do they now need a small cache layer?
- Do cache key names still reflect the real payload and route responsibility?

### Completion Criteria
- Any cache change stays inside the current architecture and preserves behavior.
- Any obsolete or misleading cache helper is either removed or explicitly justified.
- Related docs remain aligned with the runtime after the change.
- Verification should use at least `npm run typecheck` and `npm run build`, plus route or API smoke checks when cache behavior changes.

### Current Review Result (2026-03-25)
- Obsolete cached first-load helpers for the old collection-gallery and broader catalog route payloads were removed from `repository.ts`.
- The first-load cache layer now stays focused on the active route-entry payloads: the daily dex-number snapshot and the team-builder option snapshot.
- By-dex detail reads remain uncached for now because they are small, selection-driven follow-up reads and do not yet justify another cache layer.
### Immediate Work
- Review the current `unstable_cache` helpers in `features/pokedex/server/repository.ts`.
- Check whether any snapshot helper is now redundant after the on-demand detail-fetch change.
- Keep any cache cleanup or renaming limited to `repository.ts` unless a direct dependency requires a small related edit.
- Preserve the current route behavior for `/daily`, `/my-pokemon`, and `/teams`.
- Update docs and rerun lightweight verification after any cache adjustment.

### Later Work
- Revisit broader route-level cache policy after enough measurements accumulate.
- Consider whether by-dex detail reads need a dedicated cache layer once real usage patterns are clearer.
- Re-evaluate invalidation strategy if auth, account-linked ownership, or broader catalog mutation flows are introduced.
- Revisit larger Next.js cache primitives only when the current smaller cleanup no longer explains the remaining bottleneck.

## Immediate Follow-Up TODO
- Replace browser-generated anonymous session handling with a stronger server-managed session boundary when auth work begins.
- Keep docs/verification-guide.md aligned with the current daily, collection, and team verification flow after migrations, payload changes, and server restarts.
- Keep monitoring the reduced first-load payload strategy across `/daily`, `/my-pokemon`, and `/teams`.
  - A reduced catalog-list payload shipped on 2026-03-24, replacing the previous full `PokemonSummary` route payload for the daily, collection, and team-builder pages.
  - On 2026-03-25, the shared reduced payload was split again so `/daily` and `/my-pokemon` no longer receive team-builder ability data, and `/teams` no longer receives collection-only fields such as slugs, generation, and shiny image variants.
  - In follow-up steps on 2026-03-25, `/daily` was reworked to ship only daily candidate dex numbers, `/teams` was reworked to ship only a small option payload instead of the full team-builder catalog, and `/my-pokemon` was reworked to ship no gallery catalog on first render.
  - Local `npm run start` measurement on 2026-03-26 showed first-response payload sizes of 478645 bytes for `/`, 25956 bytes for `/daily`, 21847 bytes for `/my-pokemon`, and 75230 bytes for `/teams`; see `docs/performance-guide.md` for the full dev/start table and API measurements.
- Revisit the current caching approach for reduced and full catalog reads.
  - `unstable_cache` should be re-evaluated after payload shape changes because cache effectiveness and data-cache limits may differ by route payload size.
  - Any follow-up should verify whether cache granularity, payload shape, or route-level read strategy needs to change.
- Keep `docs/performance-guide.md` aligned with the current dev/start measurement workflow and rerun it after each meaningful performance change across `/`, `/daily`, `/my-pokemon`, `/teams`, `/api/daily/state`, and `/api/teams/state`.

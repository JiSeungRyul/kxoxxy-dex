# Architecture

## Current System Shape
- The app uses Next.js App Router with domain logic in `features/pokedex`.
- The runtime is hybrid:
  - list, detail, daily, and my-pokemon catalog reads are DB-backed
  - snapshot generation and DB import still coexist in the data pipeline
- The target runtime shape is a clearer frontend UI -> server/API -> PostgreSQL data boundary, even while the catalog source pipeline remains hybrid for now.
- Persisted user state now resolves through authenticated `user_id` for favorites, daily/my-pokemon, and teams/my-teams.
- Legacy anonymous-session ownership is no longer part of the active runtime or active schema path for persisted product features.
- The current auth shape is minimal provider-backed Google sign-in plus a server-managed authenticated session that resolves `users.id`.
- Minimal auth schema groundwork now exists for `users`, `auth_accounts`, and `sessions`, and the active runtime uses the provider-backed authenticated-session flow rather than the older development-only issuance path.

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
2. `PokedexPage` requests daily state through `app/api/daily/state/route.ts`
3. `app/api/daily/state/route.ts` requires authenticated session and reads/writes daily state through `user_id`
4. `PokedexPage` fetches encounter and recent-capture detail on demand through `app/api/pokedex/catalog/route.ts` when the daily client state is ready
5. `app/my-pokemon/page.tsx` ships no gallery catalog on first render and relies on the same authenticated collection state to request captured-card detail on demand through `app/api/pokedex/catalog/route.ts`
6. `PokedexPage` loads collection state from the same authenticated API for both `/daily` and `/my-pokemon`
7. When auth is absent, `/daily` and `/my-pokemon` render login CTA states instead of returning persisted collection data

### Team Routes
1. `app/teams/page.tsx` loads a small team-builder option list with dex number, Korean name, generation, and Pokedex-name metadata plus reduced item option entries from PostgreSQL through `getPokedexTeamBuilderOptionSnapshot()` and `getPokedexTeamBuilderItemOptionSnapshot()`
2. `TeamBuilderPage` fetches selected Pokemon detail on demand through `app/api/pokedex/catalog/route.ts` and selected slot-aware move options on demand through `app/api/pokedex/moves/route.ts` so the first render does not ship the full team-builder catalog or move learnset data
3. `TeamBuilderPage` requests saved team state through `app/api/teams/state/route.ts`
4. `app/api/teams/state/route.ts` requires authenticated session and reads/writes team and team-member rows through `user_id`
5. `app/my-teams/page.tsx` reads the saved team list for the current authenticated user
6. Team member detail views join saved member configuration with the latest `pokemon_catalog.payload` snapshot and compute level-based battle stats in the client
7. Saved team members now persist a nullable `formKey` field for limited non-Mega form support, separate from the existing Mega-only `megaFormKey`
8. The current first-pass non-Mega form support is intentionally limited to Rotom appliance forms, a small regional-form shortlist including the same-dex multi-region `나옹(알로라/가라르)` case, a small legendary/mythical shortlist (`기라티나 오리진폼`, `쉐이미 스카이폼`), and `팔데아 켄타로스` breed forms, while the move-query path uses slot + `formKey` overrides only for a bounded set of known form-specific move gaps instead of reopening the whole form-specific learnset catalog at once

## Catalog Data Pipeline
1. `scripts/sync-pokedex.mjs` fetches from PokeAPI
2. The script writes `data/pokedex.json`
3. `scripts/sync-items.mjs` fetches the full PokeAPI item list and writes `data/item-catalog.json`
4. `scripts/sync-moves.mjs` fetches the full PokeAPI move list plus per-Pokemon learnset data and writes `data/move-catalog.json`
5. `scripts/import-pokedex-to-db.mjs` imports the Pokemon snapshot into PostgreSQL
6. `scripts/import-items-to-db.mjs` imports the item snapshot into PostgreSQL
7. `scripts/import-moves-to-db.mjs` imports the move snapshot and per-Pokemon learnset rows into PostgreSQL
8. Runtime list/detail/daily catalog reads use the imported Pokemon catalog tables
9. The current move pipeline stores learnsets at the national-dex level, so form-specific learnset exceptions are not yet separated inside `pokemon_move_catalog`
10. The move pipeline still stores learnsets at the national-dex level, so the current Rotom form support uses a small query-time override layer rather than a broader form-normalized learnset model
11. If broader non-Mega form-specific team building is added later, both the saved team-member model and the move-query path will need a wider `formKey` rollout than the current Rotom-plus-selected-regional first pass
12. `28-5` confirms that the existing DB catalog is still sufficient for the current MVP team-builder scope: searchable item options, searchable move options, saved `formKey`, and the current bounded form-specific move override set do not yet require broader schema changes

## Hybrid Boundary Status
- `28-1` confirms that the current hybrid split is no longer “some routes use files, some routes use DB”.
- Instead, the current split is:
  - runtime route/API reads -> imported PostgreSQL catalog/state tables
  - snapshot generation and seed/import workflow -> checked-in `data/*.json` plus PokeAPI fetch scripts
- The remaining runtime coupling to the snapshot model is indirect:
  - repository helpers such as `getLatestSnapshotRecord()` and `getLatestMoveSnapshotRecord()` still select the latest imported snapshot lineage before reading catalog rows
  - this means runtime is DB-backed, but not yet fully detached from snapshot-version concepts in the schema
- The clearest examples:
  - `/daily` first render reads dex numbers from PostgreSQL, not from `data/pokedex.json`
  - `/teams` first render reads Pokemon/item option payloads from PostgreSQL, not from local snapshot files
  - `/api/pokedex/moves` reads move and learnset rows from PostgreSQL, but the imported move catalog still originates from `data/move-catalog.json`
- `28-2` further splits that boundary by domain:
  - pokedex runtime -> `pokemon_catalog`, generation/import -> `data/pokedex.json` + `pokedex_snapshots`
  - item runtime -> `item_catalog`, generation/import -> `data/item-catalog.json` + `item_snapshots`
  - move runtime -> `move_catalog` + `pokemon_move_catalog`, generation/import -> `data/move-catalog.json` + `move_snapshots`
  - move generation still has the strongest snapshot coupling because `scripts/sync-moves.mjs` reads `data/pokedex.json` before import
- `28-3` narrows the next cleanup target:
  - old local-file runtime helpers such as `readPokedexSnapshot()` / `getPokedexSnapshot()` / `getPokemonBySlug()` are cleanup candidates
  - DB lineage selectors such as `getLatestSnapshotRecord()` and `getLatestMoveSnapshotRecord()` are not cleanup candidates yet because active runtime flows still depend on them
- `28-6` does not add new catalog indexes yet:
  - current runtime still leans on existing slug keys, snapshot filtering, and the current `pokemon_move_catalog` uniqueness/index shape
  - any future index work should be driven by heavier Korean-name search, broader filtered-list traffic, or wider move legality access patterns rather than by speculative early tuning

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
  - the current runtime still carries anonymous fallback persistence alongside authenticated `user_id` persistence, but the desired product end state is auth-required persistence rather than long-lived dual ownership
- Doc drift:
  - architecture can become misleading unless runtime-path changes are documented immediately

## Ownership Transition Scope
- Daily and my-pokemon state now support both ownership paths:
  - anonymous daily state by `anonymous_session_id`
  - authenticated daily state by `user_id`
- Team state now also supports both ownership paths:
  - anonymous team state by `anonymous_session_id`
  - authenticated team state by `user_id`
- The long-term durable owner should be `user_id` once auth work begins.
- The current project plan does not require preserving or merging old anonymous development-era records into future user-owned records.
- That means the ownership follow-up is primarily a schema-and-runtime-boundary planning task, not a legacy-data migration project.

## Preferred Authentication Shape
- Start with one minimal auth path and a server-managed auth session instead of opening multiple providers or a broader account system immediately.
- Add a separate authenticated session boundary that resolves `users.id` for logged-in requests.
- Prefer switching persisted product features directly to authenticated `user_id` ownership instead of making anonymous and authenticated ownership co-equal long-term paths.
- The intended authenticated write order is favorites, then daily/my-pokemon state, then teams.
- A shared ownership resolver now codifies the current transitional rule at the server boundary by returning authenticated `userId` first and anonymous `sessionId` as the fallback path.
- That first authenticated write target is now live for favorites: authenticated favorites resolve by `user_id`, while anonymous favorites still resolve by `anonymous_session_id`.
- That next authenticated write target is now also live for daily/my-pokemon: authenticated daily state resolves by `user_id`, while anonymous daily state still resolves by `anonymous_session_id`.
- That final current authenticated write target is now also live for teams/my-teams: authenticated team state resolves by `user_id`, while anonymous team state still resolves by `anonymous_session_id`.
- The next intended cutover is to stop treating those anonymous paths as user-facing persistence and instead gate persisted state behind authenticated session checks.
- `29-8` fixes the runtime policy for that cutover:
  - public browsing stays open
  - persisted state APIs stop issuing anonymous ownership for unauthenticated requests
  - client routes that depend on persisted state should show auth-required CTA/empty states instead of anonymous saved data
- `29-9` is now live for favorites:
  - `app/api/favorites/state/route.ts` reads only authenticated session-backed `user_id`
  - unauthenticated requests receive an auth-required `401` response instead of anonymous fallback data
  - `/favorites` and the favorite-toggle entry points now treat Google sign-in as the persistence entry boundary
- `29-10` is now live for daily/my-pokemon:
  - `app/api/daily/state/route.ts` reads and writes only authenticated session-backed `user_id`
  - unauthenticated requests receive an auth-required `401` response instead of anonymous fallback data
  - `/daily` and `/my-pokemon` now treat Google sign-in as the persistence entry boundary for collection progress
- `29-11` is now live for teams/my-teams:
  - `app/api/teams/state/route.ts` reads and writes only authenticated session-backed `user_id`
  - unauthenticated requests receive an auth-required `401` response instead of anonymous fallback data
  - `/teams` and `/my-teams` now treat Google sign-in as the persistence entry boundary for saved team management
- `29-12` now removes the leftover anonymous-session runtime helpers and local-storage handoff path, so auth-required persistence is the only active runtime path for favorites, daily/my-pokemon, and teams/my-teams

## Auth Replacement Boundary
- The current reusable auth boundary is:
  - `features/pokedex/server/auth-session.ts#resolveAuthenticatedUserSession()`
  - `app/api/auth/session/route.ts` GET handler
- The current development-only boundary that should be replaced is:
  - `createDevelopmentAuthSession()`
  - `POST /api/auth/sign-in`
  - `POST /api/auth/sign-out`
  - the development-login action in `features/site/components/site-hero-header.tsx`
- This keeps the `user_id` ownership runtime stable while narrowing real-auth implementation work to sign-in, sign-out, and authenticated session lifecycle.
- The current no-key groundwork already follows that boundary split: session reads stay on `/api/auth/session`, while sign-in/sign-out are isolated so a real provider can replace only the issuance path later.
- The current provider-backed Google route layer now does the first real replacement step:
  - `GET /api/auth/sign-in` creates the Google OAuth redirect URL
  - `GET /api/auth/callback/google` validates state and materializes a local authenticated session
  - `POST /api/auth/sign-out` removes that local authenticated session
- That provider-backed route layer is now verified through a real local Google login round-trip, and the resulting session can read/write favorites, daily state, and teams through the existing `user_id` ownership paths.

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

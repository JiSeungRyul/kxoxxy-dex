# Session Guide

## One-line Summary
KxoxxyDex is a hybrid Pokedex app where runtime catalog reads are DB-backed,
while snapshot generation and DB-backed runtime flows currently coexist.

## Purpose
- Give a new AI agent enough context to work safely and quickly.
- Point to the right source document instead of repeating full project history.

## Read Order
1. docs/project-overview.md
2. docs/current-product.md
3. docs/architecture.md

(Optional)
4. docs/database-plan.md
5. docs/implemented-tasks.md
6. docs/verification-guide.md
7. docs/performance-guide.md

If the task depends on local PostgreSQL, read `docs/database-plan.md` for the required startup order:
`docker compose up -d` -> `npm run db:migrate` -> `npm run db:seed:pokedex` -> `npm run db:seed:items` -> `npm run db:seed:moves`.

If the task depends on refreshing upstream catalog content rather than only importing existing local snapshots, also account for the sync/import split:
- `npm run sync:pokedex` refreshes `data/pokedex.json`
- `npm run sync:items` refreshes `data/item-catalog.json`
- `npm run sync:moves` refreshes `data/move-catalog.json` and still depends on `data/pokedex.json`
- `npm run db:seed:pokedex` and `npm run db:seed:items` only import the current local snapshot files
- `npm run db:seed:moves` regenerates the move snapshot and then imports it

If the task depends on `/favorites`, `/daily`, `/my-pokemon`, `/teams`, `/my`, `/teams/random`, or their state/auth APIs, read `docs/verification-guide.md` before changing the verification flow.

If the task depends on route or API performance measurement, read docs/performance-guide.md before changing the measurement workflow.

## Current Runtime Truth
- The repository is in a hybrid state.
- `/` and `/pokedex` load list data through PostgreSQL-backed catalog queries.
- `/pokemon/[slug]` loads detail data from PostgreSQL-backed catalog queries.
- `/favorites` loads saved favorite dex numbers through the authenticated favorites API and fetches favorite card detail on demand through `app/api/pokedex/catalog`.
- `/daily` now loads a dex-number-only daily candidate index through PostgreSQL-backed catalog queries and fetches encounter/recent-capture detail on demand through `app/api/pokedex/catalog`.
- `/daily` stores encounter and capture state through authenticated `user_id` ownership, including shiny flags.
- `/my-pokemon` now loads captured Pokemon detail on demand through `app/api/pokedex/catalog` after authenticated collection state is loaded, instead of shipping the gallery catalog on first render.
- `/my-pokemon` reads captured collection state through the same authenticated API used by daily.
- `/teams` now loads a small option list with dex number, Korean name, generation, and Pokedex-name metadata through PostgreSQL-backed catalog queries and fetches selected team-member detail on demand through `app/api/pokedex/catalog`.
- `/teams` and `/my-teams` read and write team data through the same authenticated `user_id`-backed PostgreSQL APIs, including per-member level configuration.
- `/teams/random` now reads the same reduced team-builder option payload from PostgreSQL, samples six species in the client, and fetches displayed card detail through `app/api/pokedex/catalog` without touching saved team state.
- Legacy anonymous-session handoff and local-storage session migration are no longer part of the active client runtime.
- Auth routing is mode-aware:
  - `GET /api/auth/session` returns current-session state plus `authMode`
  - `GET /api/auth/sign-in` is the canonical user-facing sign-in entry, starting Google OAuth in provider mode or creating a development fallback session plus redirect when provider auth is not configured
  - `POST /api/auth/sign-in` remains as a local development fallback/session-test boundary when provider auth is not configured
  - `POST /api/auth/sign-out` clears the current local authenticated session
- Soft-deleted inactive accounts are now rejected at the authenticated-session boundary: existing auth-session rows are treated as invalid, and protected routes fall back to login-required states until the account is active again.
- `/my` now also includes a first account deletion request entry that posts to `app/api/account/delete` and soft-deletes the current account while clearing active sessions.
- The same account flow now also allows grace-period recovery: a soft-deleted user who signs in again within the current recovery window is reactivated and lands on `/my` with a restore notice.
- Once that recovery window expires, the planned cleanup path is an operations-driven hard delete of the `users` row so FK cascades remove favorites, daily state, and team state together.
- Separate from deletion, the current docs now define a future gameplay-data reset scope that keeps `users` / `auth_accounts` / `sessions` intact while clearing favorites, daily collection state, and saved teams in a fixed order.
- `/teams` now has a first-pass general form selector for Rotom appliance forms, a small regional-form shortlist including `나옹(알로라/가라르)`, a small legendary/mythical shortlist (`기라티나 오리진폼`, `쉐이미 스카이폼`), and `팔데아 켄타로스` breed forms, and the move API uses slot + `formKey` input so matching form-specific move overrides can be exposed where the current MVP supports them.
- Team persistence assumes the `teams` and `team_members` tables have been migrated and the local dev server has been restarted when Windows reload issues occur.
- Local `npm run start` measurement on 2026-03-26 showed first-response payload sizes of 478645 bytes for `/`, 25956 bytes for `/daily`, 21847 bytes for `/my-pokemon`, and 75230 bytes for `/teams`; see `docs/performance-guide.md` for the full dev/start table and method.
- Snapshot generation still starts from PokeAPI and writes `data/pokedex.json`.
- Additional item and move snapshot generation now writes `data/item-catalog.json` and `data/move-catalog.json`.
- The generated move snapshot is local-only, and `npm run db:seed:moves` now regenerates it automatically before importing into PostgreSQL.
- PostgreSQL import still starts from local snapshot files and now populates `pokedex_*`, `item_*`, and `move_*` catalog tables.
- In other words, the default local workflow is now:
  - migrate first
  - import current local snapshot files for runtime data
  - run `sync:*` only when an upstream dataset refresh is intentionally part of the task

## Files To Verify First
- `app/page.tsx`
- `app/pokedex/page.tsx`
- `app/pokemon/[slug]/page.tsx`
- `app/favorites/page.tsx`
- `app/daily/page.tsx`
- `app/my-pokemon/page.tsx`
- `app/teams/page.tsx`
- `app/teams/random/page.tsx`
- `app/my-teams/page.tsx`
- `app/my/page.tsx`
- `app/api/auth/session/route.ts`
- `app/api/auth/sign-in/route.ts`
- `app/api/auth/sign-out/route.ts`
- `app/api/auth/callback/google/route.ts`
- `app/api/favorites/state/route.ts`
- `app/api/account/delete/route.ts`
- `app/api/teams/state/route.ts`
- `features/pokedex/server/auth-session.ts`
- `features/pokedex/server/repository.ts`
- `features/pokedex/components/pokedex-page.tsx`
- `features/pokedex/types.ts`
- `scripts/sync-pokedex.mjs`
- `scripts/import-pokedex-to-db.mjs`
- `scripts/sync-items.mjs`
- `scripts/import-items-to-db.mjs`
- `scripts/sync-moves.mjs`
- `scripts/import-moves-to-db.mjs`

## Working Constraints
- Prefer small, incremental changes over broad rewrites.
- Do not rewrite large parts of the codebase unless a migration step is explicitly planned.
- Always check `docs/architecture.md` before modifying data flow.
- Do not assume the database is active unless that is explicitly verified for the task at hand.
- Treat `features/pokedex/types.ts` as the contract for snapshot and catalog payload shape.
- Keep route files in `app/` thin and push product logic into `features/pokedex/`.
- Preserve the current server/client boundary:
  - server data access in `features/pokedex/server/`
  - interactive state in client components
- Treat `.codexignore` as the local Codex token-budget boundary:
  - keep source code, runtime docs, and current source-of-truth files readable unless there is a strong reason to exclude them
  - when new local-only generated artifacts, caches, logs, or secret-bearing files are introduced, add them to `.codexignore` in the same task so future sessions do not waste context on them
- Do not describe the app as fully DB-backed.
- Do not describe the app as fully snapshot-backed.
- When changing docs, keep the hybrid runtime model explicit.

## Known Risks To Keep In Mind
- Source-of-truth ambiguity:
  - snapshot exists
  - DB catalog exists
  - different routes currently use different read paths
- Environment coupling:
  - `lib/db/client.ts` requires `DATABASE_URL`
  - DB-related runtime assumptions must be stated explicitly
- User state migration:
  - authenticated ownership is now the active runtime path, but older docs or code comments may still describe anonymous-session persistence

## Catalog Import Workflow (Added: 2026-04-05)
- `28-4` is now completed at the documentation level.
- Current default local workflow is DB-first at runtime but snapshot-first at import time:
  1. `docker compose up -d`
  2. `npm run db:migrate`
  3. `npm run db:seed:pokedex`
  4. `npm run db:seed:items`
  5. `npm run db:seed:moves`
  6. start the app with `npm run dev` or `npm run start`
- Use `sync:*` only when the task explicitly intends to refresh upstream source data:
  - `sync:pokedex` before reseeding Pokemon catalog from a refreshed `data/pokedex.json`
  - `sync:items` before reseeding item catalog from a refreshed `data/item-catalog.json`
  - `sync:moves` only for move-source refreshes; `db:seed:moves` already regenerates the move snapshot before import
- Practical implication:
  - most runtime or schema work should stop at `db:migrate` plus the needed `db:seed:*` commands
  - `sync:*` is a dataset refresh workflow, not a routine runtime verification step
- Daily and team migration caveat:
  - the persisted-state APIs depend on migrated authenticated user-state tables and can fail until DB migrations are applied
- Local runtime caveat:
  - on Windows, DB-related changes may require a clean Next.js dev server restart because `.next/trace` locking can interfere with reload behavior
- Doc drift:
  - architecture and product docs must be updated when runtime paths change

## Latest Session Handoff (2026-04-02)
- The anonymous-session hardening work in backlog item `22` is fully completed.
- Historical note:
  - this was the cookie-hardening step before auth-required persistence replaced anonymous saved-state behavior
- Local verification already completed for the cookie-based session flow:
  - `npm run typecheck`
  - `npm run build`
  - local smoke checks for `/daily`, `/my-pokemon`, `/teams`, `/my-teams`
  - `GET /api/daily/state`
  - `GET /api/teams/state`
  - `/api/teams/state` save/delete round-trip
- Backlog item `23` is also fully defined at the planning/documentation level.
- The key `23` decision is:
  - future durable ownership should move to `user_id`
  - legacy anonymous-session data migration/merge is intentionally out of scope because this is not a live production app
- The main documents for that ownership decision are:
  - `docs/database-plan.md`
  - `docs/architecture.md`
- The next practical task is backlog item `24`: tighten post-migration and post-restart verification guidance.

## Authentication Direction (Added: 2026-04-03)
- The preferred auth direction for this repo is minimal auth plus server-managed authenticated sessions, not a broad multi-provider rollout on day one.
- The intended runtime shape is:
  - unauthenticated user -> browse-only routes plus login CTA for persisted features
  - authenticated session -> server-managed auth session that resolves a durable `user_id`
- Once auth exists, new authenticated writes should move directly to `user_id` ownership instead of extending long-lived dual ownership.
- Legacy anonymous-session data merge remains out of scope unless a later product requirement explicitly reopens it.
- Minimal auth groundwork now exists at the schema level:
  - `users`
  - `auth_accounts`
  - `sessions`
- A minimal authenticated-session read boundary now also exists at `/api/auth/session`.
- The header now resolves auth mode from `/api/auth/session` and can either start Google OAuth in provider mode or issue a development fallback session when provider auth is not configured.
- Local verification for that boundary now includes:
  - unauthenticated `GET /api/auth/session` -> `authenticated: false`
  - temporary local `users` + `sessions` rows plus `kxoxxy-auth-session` cookie -> `authenticated: true`
- Local verification for the current auth UI now also includes:
  - development fallback `POST /api/auth/sign-in` -> auth cookie issued when provider auth is not configured
  - provider mode `GET /api/auth/sign-in` -> Google redirect start when provider auth is configured
  - follow-up `GET /api/auth/session` -> `authenticated: true`
  - `POST /api/auth/sign-out` -> auth cookie cleared
  - final `GET /api/auth/session` -> `authenticated: false`
- Favorites, daily/my-pokemon, and teams/my-teams now all use authenticated `user_id` as the only active runtime owner.
- Real provider-backed Google auth is now live for local runtime verification when provider env vars are configured, and development fallback still remains available through the header when they are not.
- `/my` now exists as the first account-hub route and renders the current user's name, email, and provider from the authenticated session.
- `/my` now also aggregates favorites count, captured count, and saved-team count on the server for the first account-hub summary view.
- `/my` now also acts as the first account-hub navigation surface for `/favorites`, `/my-pokemon`, and `/my-teams`.
- `/my` now also centralizes the current account status and login-required persistence guidance in one place.
- The main header now uses `/my` as the account entry point, and favorites navigation has moved under that account-hub flow.
- `/favorites` now reuses shared Pokedex filter options and richer catalog entries so saved favorites can be searched, filtered, sorted, and paginated without a separate favorites-only data model.
- Favorites UI now also shares favorite-number updates between list, detail, and `/favorites` views via a small client-side sync event, and the favorites gallery now shows a dedicated filtered-empty message when active search/filter conditions hide every saved favorite.
- `/my-pokemon` now also derives a small account-bound summary view directly from the authenticated collection state, so the page exposes captured count, shiny count, recent capture count, and latest capture time without adding a separate server summary endpoint.
- `/my-pokemon` now also has a first management-controls pass: name search, type filter, shiny-only filter, and recent-capture sorting all run directly against the authenticated collection state, while generation filtering remains deferred until a richer read-model is needed.
- `/daily` and `/my-pokemon` copy now explicitly call out that they share the same authenticated collection progress, so captures from the daily encounter flow and releases from the collection view are described as one account-bound loop.
- `/my-teams` now has a first account-management control: the saved-team list can be reordered client-side by recent update, team name, format label, or mode label without changing the existing team-state API shape.
- `/my-teams` now also adds two lightweight account-management actions on top of the existing edit entry: duplicate a saved team through the current save path, and rename a saved team through the same API without opening the full builder first.
- `/my-teams` now also has a first list-management filter bar: saved teams can be narrowed by team name, format, and mode before the existing sort control is applied.

## Ownership Transition Status (Added: 2026-04-03)
- Backlog item `26` is now fully completed.
- Current authenticated `user_id` persistence is live for:
  - favorites
  - daily / my-pokemon state
  - teams / my-teams state
- Anonymous persistence is no longer part of the active product runtime for persisted features.
- The remaining auth follow-up is no longer the `user_id` write transition itself.
- The next auth follow-up is tightening the coexistence boundary between provider mode and the remaining development fallback issuance path.

## Account Auth Replacement Plan (Added: 2026-04-05)
- Backlog items `29-1` through `29-3` are now defined at the planning level.
- Keep:
  - `resolveAuthenticatedUserSession()` as the current-session read boundary
  - `/api/auth/session` as the current-session read endpoint for the header and other client UI
- Replace:
  - `createDevelopmentAuthSession()` as the session-issuance path
  - the old development-only `POST /api/auth/sign-in` login flow
  - the header button copy and click path that currently says `개발용 로그인`
- Preferred real-auth shape:
  - one minimal provider-backed sign-in entry
  - one sign-out entry
  - keep current-session reads separate from session issuance
- The replacement goal is to preserve the existing `user_id` ownership behavior for favorites, daily/my-pokemon, and teams while swapping only the auth-session issuance and lifecycle boundary.
- The current no-key groundwork now reflects that split:
  - `GET /api/auth/session` stays as the current-session read endpoint
  - `GET /api/auth/sign-in` is the canonical user-facing sign-in entry for both auth modes
  - `POST /api/auth/sign-in` is the remaining local development fallback/session-test boundary when provider auth is not configured
  - `POST /api/auth/sign-out` is the shared lifecycle boundary for both modes
  - provider env vars stay optional for now, and when they are empty the sign-in route keeps the current development fallback
- Google auth route groundwork is now live when provider env vars are present:
  - `GET /api/auth/sign-in` redirects to Google and sets an auth-state cookie
  - `GET /api/auth/callback/google` validates `state`, exchanges `code`, upserts `users` / `auth_accounts`, creates a local `sessions` row, and issues `kxoxxy-auth-session`
  - `POST /api/auth/sign-out` clears the local auth session
- Local verification for that provider-backed route layer currently covers:
  - `GET /api/auth/session` -> `authMode: "provider"`
  - `GET /api/auth/sign-in` -> Google redirect URL plus `kxoxxy-auth-state`
  - invalid-state callback guard -> redirect with `authError=invalid-state`
  - inactive account callback guard -> redirect with `authError=account-inactive`
  - grace-period account recovery -> redirect to `/my?accountRestored=true`
- Browser-driven Google login verification now also covers:
  - real Google callback -> local `users` / `auth_accounts` / `sessions` row creation
  - provider-backed `GET /api/auth/session` -> `authenticated: true`
  - provider-backed favorites toggle round-trip
  - provider-backed daily capture / release round-trip
  - provider-backed teams save / delete round-trip

## Persistence Auth Requirement Direction (Added: 2026-04-05)
- Product direction is now shifting away from long-lived anonymous persistence.
- Keep browse-only routes open without login:
  - `/`
  - `/pokedex`
  - `/pokemon/[slug]`
- Move persisted user-state routes toward auth-required behavior:
  - `/favorites`
  - `/daily`
  - `/my-pokemon`
  - `/teams`
  - `/my-teams`
- Under that direction, the intended steady state is:
  - unauthenticated user -> catalog browsing only plus login CTA for persistence features
  - authenticated user -> all persistence reads/writes resolved by `user_id`
- `29-8` policy is now fixed at the runtime level:
  - unauthenticated requests to persisted state APIs should no longer mint or reuse anonymous owners
  - persisted state routes should render auth-required empty/login states instead of anonymous saved data
  - browse-only routes remain public and unchanged
- That means the current anonymous persistence boundary should be treated as transitional implementation debt, not the desired product end state.
- Impacted runtime pieces when this cutover begins:
  - `app/api/favorites/state/route.ts`
  - `app/api/daily/state/route.ts`
  - `app/api/teams/state/route.ts`
  - login CTA / empty-state copy in the favorites, daily, collection, and team-builder UI
- The preferred sequence is:
  - finish real provider-backed auth verification first
  - gate favorites behind authenticated session
  - gate daily / my-pokemon behind authenticated session
  - gate teams / my-teams behind authenticated session
  - then remove the remaining anonymous persistence fallback paths and legacy local-storage handoff logic
- Favorites is now the first route fully switched to auth-required persistence:
  - `/api/favorites/state` now returns `401` with `authRequired: true` when no authenticated session exists
  - `/favorites` now shows a login CTA instead of anonymous saved data
  - favorites toggles from the main Pokedex and Pokemon detail page now use `/api/auth/sign-in` as the entry point when auth is missing
- Daily and my-pokemon are now the next routes switched to auth-required persistence:
  - `/api/daily/state` now returns `401` with `authRequired: true` when no authenticated session exists
  - `/daily` and `/my-pokemon` now show login CTA states instead of anonymous saved progress
  - capture / reset / reroll / release actions now use `/api/auth/sign-in` as the entry point when auth is missing
- Teams and my-teams are now also switched to auth-required persistence:
  - `/api/teams/state` now returns `401` with `authRequired: true` when no authenticated session exists
  - `/teams` and `/my-teams` now show login CTA states instead of anonymous saved team data
  - team save / delete actions now use `/api/auth/sign-in` as the entry point when auth is missing
- `29-12` now also completes the remaining cleanup:
  - the old anonymous-session helper files are removed from the active runtime
  - the old local-storage session handoff is removed from the client
  - persisted collection state is no longer mirrored into local storage as a compatibility fallback
  - the follow-up DB cleanup removes `anonymous_sessions` plus legacy `anonymous_session_id` columns from persisted state tables

## Hybrid Runtime Boundary Check (Added: 2026-04-05)
- `28-1` is now completed at the documentation level.
- Current runtime truth by code path:
  - `/`, `/pokedex` -> `features/pokedex/server/list-page.ts` -> `repository.ts#getPokedexListPage()` -> PostgreSQL `pokemon_catalog`
  - `/pokemon/[slug]` -> `repository.ts#getPokemonDetailBySlug()` and `getAdjacentPokemonByDexNumber()` -> PostgreSQL `pokemon_catalog`
  - `/daily` -> `repository.ts#getPokedexDailyDexNumberSnapshot()` -> PostgreSQL `pokedex_snapshots` + `pokemon_catalog`
  - `/my-pokemon` -> authenticated state API + `app/api/pokedex/catalog` -> PostgreSQL `daily_*` state tables + `pokemon_catalog`
  - `/teams` -> `repository.ts#getPokedexTeamBuilderOptionSnapshot()` and `getPokedexTeamBuilderItemOptionSnapshot()` -> PostgreSQL `pokemon_catalog` + `item_catalog`
  - `/api/pokedex/moves` -> `repository.ts#getPokemonTeamBuilderMoveOptions()` -> PostgreSQL `move_catalog` + `pokemon_move_catalog`
- That means the active route/runtime source of truth is already PostgreSQL for list/detail/catalog reads.
- Snapshot files are still source-of-truth for generation/import steps, not for direct route rendering:
  - `scripts/sync-pokedex.mjs` -> `data/pokedex.json`
  - `scripts/sync-items.mjs` -> `data/item-catalog.json`
  - `scripts/sync-moves.mjs` -> `data/move-catalog.json`, and this move generation step still reads `data/pokedex.json`
  - `scripts/import-*.mjs` then truncate/import those snapshots into PostgreSQL
- The main remaining hybrid boundary is therefore:
  - runtime reads from imported DB payload rows
  - generation and seed/import still start from checked-in snapshot files
- A second smaller hybrid wrinkle remains inside repository helpers:
  - many runtime reads first resolve the latest snapshot row id in PostgreSQL (`pokedex_snapshots`, `item_snapshots`, `move_snapshots`) and then read the imported catalog rows attached to that snapshot
  - this is still DB-backed runtime behavior, but it means the runtime depends on imported snapshot lineage rather than on fully normalized catalog versioning

## Domain Source-Of-Truth Split (Added: 2026-04-05)
- `28-2` is now completed at the documentation level.
- Pokedex domain:
  - runtime source of truth -> PostgreSQL `pokemon_catalog` plus `pokedex_snapshots` for latest imported snapshot selection
  - snapshot-first path -> `scripts/sync-pokedex.mjs` writes `data/pokedex.json`, and `scripts/import-pokedex-to-db.mjs` imports that file into DB
- Item domain:
  - runtime source of truth -> PostgreSQL `item_catalog` plus `item_snapshots` for latest imported snapshot selection in the team-builder item option flow
  - snapshot-first path -> `scripts/sync-items.mjs` writes `data/item-catalog.json`, and `scripts/import-items-to-db.mjs` imports that file into DB
- Move domain:
  - runtime source of truth -> PostgreSQL `move_catalog` and `pokemon_move_catalog`, with `move_snapshots` used to select the latest imported move lineage
  - snapshot-first path -> `scripts/sync-moves.mjs` writes `data/move-catalog.json`, and `scripts/import-moves-to-db.mjs` imports that file into DB
  - extra hybrid wrinkle -> move snapshot generation still reads `data/pokedex.json` to derive per-Pokemon learnset rows before import
- Practical implication:
  - pokedex/item/move runtime reads are already DB-first
  - generation and seed/import remain snapshot-first in all three domains
  - move generation is the least detached from the snapshot pipeline because it still depends on the Pokemon snapshot during snapshot construction

## Snapshot-Era Runtime Helper Candidates (Added: 2026-04-05)
- `28-3` is now completed at the documentation level.
- Cleanup candidates in `features/pokedex/server/repository.ts` are the old local-file runtime helpers that no longer back the active route tree:
  - this cleanup is now completed for the local-file Pokemon snapshot helpers that used to read `data/pokedex.json` directly
- The old local-file Pokemon snapshot helpers are no longer part of `repository.ts`.
- Non-candidates for this cleanup step:
  - `getLatestSnapshotRecord()`
  - `getLatestMoveSnapshotRecord()`
  - `readPokedexDailyDexNumberSnapshot()`
  - `readPokedexTeamBuilderOptionSnapshot()`
  - `readPokedexTeamBuilderItemOptionSnapshot()`
- Those helpers still support active runtime flows because they select the latest imported snapshot lineage inside PostgreSQL before reading catalog rows.
- Practical implication:
  - `28-3` does not mean the snapshot pipeline can be removed yet
  - it only means the remaining runtime helpers that still read local snapshot files are now explicitly identified as cleanup candidates for a later code change

## Item / Move / Form Sufficiency Check (Added: 2026-04-05)
- `28-5` is now completed at the documentation level.
- Current MVP scope that is already sufficiently DB-backed:
  - team-builder item options from `item_catalog`
  - team-builder move options from `move_catalog` + `pokemon_move_catalog`
  - saved per-member `formKey` persistence alongside `pokemon_catalog` detail hydration
  - bounded form-specific move additions through query-time override mapping
- Why this is sufficient for the current scope:
  - the active UI only needs searchable item options, searchable move options, saved selected forms, and a small known set of form-specific move gaps
  - all of those are already served from PostgreSQL-backed runtime queries
- What is not yet sufficiently modeled for a broader feature step:
  - generalized form-specific learnset legality across large multi-form groups
  - broader form-normalized move storage beyond the current national-dex-level `pokemon_move_catalog`
  - ambiguous or high-variance form families that would need wider schema and query changes
- Practical implication:
  - current team-builder follow-up work does not need a new catalog model just to continue within the current MVP scope
  - broader form/move correctness work still belongs to later normalization follow-up rather than to the current runtime cleanup pass

## Catalog Index Candidate Check (Added: 2026-04-05)
- `28-6` is now completed at the documentation level.
- Current read patterns are still acceptably served by the existing keys:
  - unique slug keys on `pokemon_catalog`, `item_catalog`, and `move_catalog`
  - the existing `pokemon_move_catalog_entry_key`
  - current user-state unique keys already used by authenticated persistence
- No immediate catalog index addition is being introduced in this step.
- Follow-up candidates only:
  - if Korean-name search grows materially, review text-search or trigram indexing around `pokemon_catalog.name_ko`
  - if filtered list traffic becomes heavier, review composite access around `pokemon_catalog(snapshot_id, generation_id, national_dex_number)`
  - if move legality or broader form-specific move work expands, review access patterns around `pokemon_move_catalog(snapshot_id, national_dex_number, move_id/move_slug)`
- Practical implication:
  - `28-6` is a “not yet needed, but now documented” step rather than a schema-change step

## Hybrid Docs Closure (Added: 2026-04-05)
- `28-7` is now completed at the documentation level.
- The current shared wording across `project-overview`, `architecture`, `current-product`, and `session-guide` is:
  - runtime catalog reads are PostgreSQL-backed
  - persisted gameplay state is account-bound and login-required at runtime
  - snapshot files still remain the upstream generation/import source for catalog domains
- Practical implication:
  - future sessions should no longer describe the current product as anonymous-session-backed at runtime
  - the repository is still hybrid, but the hybrid boundary now lives in catalog generation/import rather than in active route rendering

## Normalization Pressure Points (Added: 2026-04-05)
- `30-1` is now completed at the documentation level.
- The current normalization pressure points are:
  - `pokemon_catalog`, `item_catalog`, and `move_catalog` each keep selected lookup columns plus the full JSON payload for the same domain object
  - `pokemon_move_catalog` stores both FK-style ids and repeated move/version/method labels alongside its full payload
  - form-specific legality still lives outside the catalog schema in saved `formKey` plus bounded query-time overrides
- Practical implication:
  - the current model is intentionally payload-heavy for runtime convenience
  - future normalization work should focus first on duplicated catalog metadata and learnset/form modeling, not on the authenticated gameplay-state tables

## Duplicate Catalog Field Candidates (Added: 2026-04-05)
- `30-2` is now completed at the documentation level.
- Current duplicated lookup-versus-payload candidates:
  - `pokemon_catalog`
    - lookup columns: `slug`, `name_ko`, `generation_id`, `generation_label`, `primary_type`, `secondary_type`
    - overlapping payload fields: `payload.slug`, `payload.name`, `payload.generation`, `payload.types`
  - `item_catalog`
    - lookup columns: `slug`, `name_ko`, `category_slug`, `category_name`, `pocket_slug`, `pocket_name`
    - overlapping payload fields: `payload.slug`, `payload.name`, `payload.category`, `payload.pocket`
  - `move_catalog`
    - lookup columns: `slug`, `name_ko`, `generation_id`, `generation_label`, `type_name`, `damage_class_slug`, `damage_class_name`, `target_slug`, `target_name`
    - overlapping payload fields: `payload.slug`, `payload.name`, `payload.generation`, `payload.type`, `payload.damageClass`, `payload.target`
- Why these duplicates still exist today:
  - lookup columns support simple filtering, ordering, joins, and reduced JSON projections
  - full payload fields support read-model hydration without reconstructing the domain object at query time
- Practical implication:
  - later normalization should distinguish “true query-support columns” from “payload duplication kept only for convenience”

## Reference Table Split Check (Added: 2026-04-05)
- `30-3` is now completed at the documentation level.
- Current judgment:
  - item `category` / `pocket`
  - move `type` / `damageClass` / `target`
  do not yet justify separate reference tables in the current MVP/runtime.
- Why:
  - current runtime mostly projects these as nested label objects for selectors and detail payloads
  - there is little evidence of write-heavy reuse, independent lifecycle management, or multi-context mutation that would justify extra joins
- Practical implication:
  - if normalization work happens later, these reference tables are secondary candidates
  - move learnset modeling and form-specific legality remain the more important normalization axis

## Form-Aware Learnset Boundary (Added: 2026-04-05)
- `30-4` is now completed at the documentation level.
- Current judgment:
  - the repo can still stay on national-dex-level `pokemon_move_catalog` for the current MVP scope
  - the existing saved `formKey` plus bounded query-time move override layer is still enough for the currently supported Rotom/regional/selected-legendary forms
- A broader form-aware learnset schema becomes justified only when several conditions stack together:
  - wider non-Mega form coverage beyond the current shortlist
  - broader move legality correctness for those forms
  - more ambiguous or multi-branch form families that are awkward to model with per-dex overrides
  - product pressure to validate or expose form-specific legality as first-class data rather than as a bounded exception set
- Practical implication:
  - form-aware learnset normalization is a later trigger-based migration, not the next immediate cleanup step

## Long-Term Form Schema Direction (Added: 2026-04-05)
- `30-5` is now completed at the documentation level.
- Current long-term direction draft:
  - saved `formKey` should remain the short-term persistence handle, but in a broader normalization step it should map to a richer form identity rather than staying a loose string-only exception layer
  - move legality should eventually hang off that broader form identity when wider form coverage makes the current national-dex override model too fragile
  - broader form-family metadata should eventually become a clearer read-model than “full Pokemon payload forms array plus helper overrides”
- Practical implication:
  - the likely future shape is not “replace `formKey`”, but “promote it into a stronger form identity boundary”
  - that future step should evolve team-member persistence, move legality modeling, and broader form metadata together rather than independently

## Minimum Read-Model Requirements (Added: 2026-04-05)
- `30-6` is now completed at the documentation level.
- Even if catalog tables are normalized later, the runtime should still be able to materialize these shapes without widening route payloads:
  - `PokemonSummary` for list/detail consumption
  - `PokemonCollectionCatalogEntry` and `PokemonCollectionPageEntry` for collection and my-pokemon flows
  - `PokemonTeamBuilderOptionEntry` for first-render team selection
  - `PokemonTeamBuilderCatalogEntry` for selected team-member detail hydration
  - `PokedexItemOptionEntry` for searchable item selection
  - `PokedexMoveOptionEntry` for searchable move selection
- Practical implication:
  - later normalization should preserve or rebuild these read-models at the server boundary
  - client components should not be forced to understand a more normalized relational shape directly

## Normalization Layering Principle (Added: 2026-04-05)
- `30-7` is now completed at the documentation level.
- Future normalization should keep the following separation:
  - import pipeline -> converts upstream snapshot data into storage rows
  - runtime read-model -> reconstructs the current route/API projections from storage
  - client contract -> stays aligned with `features/pokedex/types.ts`
- Practical implication:
  - later schema work should first be absorbed by import scripts and server repository projections
  - client payload contracts should remain the last layer to change, not the first

## Normalization Preconditions And Non-Goals (Added: 2026-04-05)
- `30-8` is now completed at the documentation level.
- Explicit non-goals before a real normalization migration:
  - do not rewrite the client around relational table shapes
  - do not replace current read-model projections first
  - do not open full form-aware learnset migration until the supported form/legality scope actually requires it
  - do not split every duplicated label field into reference tables just because duplication exists
- Explicit prerequisites before a real normalization migration:
  - freeze the supported form coverage and legality expectations
  - freeze the minimum route/API read-models that must survive the migration
  - define import-script backfill or regeneration steps for the new storage model
  - define migration order and rollback expectations before touching runtime-critical catalog tables
- Practical implication:
  - `30` is now a completed review pass, not an approved immediate schema rewrite


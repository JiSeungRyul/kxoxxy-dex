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

If the task depends on /daily, /my-pokemon, /teams, or their state APIs, read docs/verification-guide.md before changing the verification flow.

If the task depends on route or API performance measurement, read docs/performance-guide.md before changing the measurement workflow.

## Current Runtime Truth
- The repository is in a hybrid state.
- `/` and `/pokedex` load list data through PostgreSQL-backed catalog queries.
- `/pokemon/[slug]` loads detail data from PostgreSQL-backed catalog queries.
- `/daily` now loads a dex-number-only daily candidate index through PostgreSQL-backed catalog queries and fetches encounter/recent-capture detail on demand through `app/api/pokedex/catalog`.
- `/daily` stores encounter and capture state through authenticated `user_id` ownership, including shiny flags.
- `/my-pokemon` now loads captured Pokemon detail on demand through `app/api/pokedex/catalog` after authenticated collection state is loaded, instead of shipping the gallery catalog on first render.
- `/my-pokemon` reads captured collection state through the same authenticated API used by daily.
- `/teams` now loads a small option list with dex number, Korean name, generation, and Pokedex-name metadata through PostgreSQL-backed catalog queries and fetches selected team-member detail on demand through `app/api/pokedex/catalog`.
- `/teams` and `/my-teams` read and write team data through the same authenticated `user_id`-backed PostgreSQL APIs, including per-member level configuration.
- Legacy anonymous-session handoff and local-storage session migration are no longer part of the active client runtime.
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
- `app/daily/page.tsx`
- `app/my-pokemon/page.tsx`
- `app/teams/page.tsx`
- `app/my-teams/page.tsx`
- `app/api/teams/state/route.ts`
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
  - the daily and team APIs depend on migrated anonymous-session tables and can fail until DB migrations are applied
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
- The header now has a development-only minimal auth panel that can create and clear a server-managed auth session for local verification.
- Local verification for that boundary now includes:
  - unauthenticated `GET /api/auth/session` -> `authenticated: false`
  - temporary local `users` + `sessions` rows plus `kxoxxy-auth-session` cookie -> `authenticated: true`
- Local verification for the current minimal login UI now also includes:
  - `POST /api/auth/session` -> auth cookie issued
  - follow-up `GET /api/auth/session` -> `authenticated: true`
  - `DELETE /api/auth/session` -> auth cookie cleared
  - final `GET /api/auth/session` -> `authenticated: false`
- Favorites, daily/my-pokemon, and teams/my-teams now all use authenticated `user_id` as the only active runtime owner.
- Real provider-backed Google auth is now live for local runtime verification, and authenticated favorites, daily/my-pokemon, and teams ownership can now be exercised without the old development-only auth path.

## Ownership Transition Status (Added: 2026-04-03)
- Backlog item `26` is now fully completed.
- Current authenticated `user_id` persistence is live for:
  - favorites
  - daily / my-pokemon state
  - teams / my-teams state
- Anonymous persistence is no longer part of the active product runtime for persisted features.
- The remaining auth follow-up is no longer the `user_id` write transition itself.
- The next larger follow-up is replacing the current development-only auth flow with a real provider-backed authentication boundary when backlog item `25` is revisited at runtime quality level.

## Account Auth Replacement Plan (Added: 2026-04-05)
- Backlog items `29-1` through `29-3` are now defined at the planning level.
- Keep:
  - `resolveAuthenticatedUserSession()` as the current-session read boundary
  - the shared ownership resolver that prefers authenticated `userId`
  - `/api/auth/session` as the current-session read endpoint for the header and other client UI
- Replace:
  - `createDevelopmentAuthSession()` as the session-issuance path
  - the old development-only `POST /api/auth/sign-in` login flow
  - the old development-only `POST /api/auth/sign-out` logout flow
  - the header button copy and click path that currently says `개발용 로그인`
- Preferred real-auth shape:
  - one minimal provider-backed sign-in entry
  - one sign-out entry
  - keep current-session reads separate from session issuance
- The replacement goal is to preserve the existing `user_id` ownership behavior for favorites, daily/my-pokemon, and teams while swapping only the auth-session issuance and lifecycle boundary.
- The current no-key groundwork now reflects that split:
  - `GET /api/auth/session` stays as the current-session read endpoint
  - `GET /api/auth/sign-in` and `POST /api/auth/sign-out` are the new issuance/lifecycle boundaries
  - provider env vars stay optional for now, and when they are empty the sign-in route keeps the current development fallback
- Google auth route groundwork is now live when provider env vars are present:
  - `GET /api/auth/sign-in` redirects to Google and sets an auth-state cookie
  - `GET /api/auth/callback/google` validates `state`, exchanges `code`, upserts `users` / `auth_accounts`, creates a local `sessions` row, and issues `kxoxxy-auth-session`
  - `POST /api/auth/sign-out` clears the local auth session
- Local verification for that provider-backed route layer currently covers:
  - `GET /api/auth/session` -> `authMode: "provider"`
  - `GET /api/auth/sign-in` -> Google redirect URL plus `kxoxxy-auth-state`
  - invalid-state callback guard -> redirect with `authError=invalid-state`
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
  - favorites toggles from the main Pokedex and Pokemon detail page now use Google sign-in as the entry point when auth is missing
- Daily and my-pokemon are now the next routes switched to auth-required persistence:
  - `/api/daily/state` now returns `401` with `authRequired: true` when no authenticated session exists
  - `/daily` and `/my-pokemon` now show login CTA states instead of anonymous saved progress
  - capture / reset / reroll / release actions now use Google sign-in as the entry point when auth is missing
- Teams and my-teams are now also switched to auth-required persistence:
  - `/api/teams/state` now returns `401` with `authRequired: true` when no authenticated session exists
  - `/teams` and `/my-teams` now show login CTA states instead of anonymous saved team data
  - team save / delete actions now use Google sign-in as the entry point when auth is missing
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
  - `readPokedexSnapshot()`
  - `getCachedPokedexSnapshot()`
  - `getPokedexSnapshot()`
  - `getPokemonBySlug()`
- These helpers still point at `data/pokedex.json` and represent the older snapshot-runtime path rather than the current DB-backed route path.
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


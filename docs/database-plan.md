# Database Plan

## Purpose
- Define the future DB direction without restating the full current product or architecture.
- Keep migration strategy explicit while the repository remains hybrid.
- Keep the near-term ownership transition simple: this repository is not currently an operating production app, so legacy anonymous-session data migration does not need to drive the design.

## What Exists Today
- PostgreSQL is configured for local development.
- Drizzle configuration and initial catalog schema are present.
- Minimal auth schema groundwork is now checked in for:
  - `users`
  - `auth_accounts`
  - `sessions`
- Current catalog tables:
  - `pokedex_snapshots`
  - `pokemon_catalog`
  - `item_snapshots`
  - `item_catalog`
  - `move_snapshots`
  - `move_catalog`
  - `pokemon_move_catalog`
- Additional runtime user-state tables are present:
  - `daily_captures`
  - `daily_encounters`
  - `favorite_pokemon`
  - `teams`
  - `team_members`
  - both daily tables now store `is_shiny` flags
- Import path:
  - `data/pokedex.json` -> `scripts/import-pokedex-to-db.mjs` -> PostgreSQL
- Item snapshot path:
  - `data/item-catalog.json` <- `scripts/sync-items.mjs` <- PokeAPI
  - `data/item-catalog.json` -> `scripts/import-items-to-db.mjs` -> PostgreSQL
- Move snapshot path:
  - `data/move-catalog.json` <- `scripts/sync-moves.mjs` <- PokeAPI + `data/pokedex.json`
  - `data/move-catalog.json` -> `scripts/import-moves-to-db.mjs` -> PostgreSQL
  - the generated move snapshot is local-only and `npm run db:seed:moves` now recreates it automatically before seeding

## Local DB Bootstrap Order
When starting from a fresh environment, `docker compose up -d` is not enough by itself.
Compose starts PostgreSQL, but the schema and imported runtime catalog data still need to be applied.

Use this order:

1. Start PostgreSQL:
   - `docker compose up -d`
2. Apply Drizzle migrations:
   - `npm run db:migrate`
3. Import the local Pokedex snapshot into PostgreSQL:
   - `npm run db:seed:pokedex`
4. Import the local item snapshot into PostgreSQL:
   - `npm run db:seed:items`
5. Import the local move snapshot into PostgreSQL:
   - `npm run db:seed:moves`
6. Start the app:
   - `npm run dev`

You can also run the DB bootstrap steps with the repository helper scripts:

- Shell:
  - full setup: `sh scripts/setup-local-db.sh`
  - migrate + seed only: `sh scripts/setup-local-db.sh --skip-compose`
- PowerShell:
  - full setup: `.\scripts\setup-local-db.ps1`
  - migrate + seed only: `.\scripts\setup-local-db.ps1 -SkipCompose`

Result:
- `docker compose up -d` creates the database server.
- `npm run db:migrate` creates the tables and indexes tracked in `drizzle/`.
- `npm run db:seed:pokedex` populates catalog tables from `data/pokedex.json`.
- `npm run db:seed:items` populates item tables from `data/item-catalog.json`.
- `npm run db:seed:moves` regenerates `data/move-catalog.json` from PokeAPI and the checked-in Pokemon snapshot, then populates move tables from it.
- `npm run dev` starts the app against a non-empty local DB.

## Sync vs Seed Responsibility
- `28-4` clarifies that the repository now has two different catalog workflows:
  - sync workflow -> refresh checked-in local snapshot files from upstream data sources
  - seed/import workflow -> load those local snapshot files into PostgreSQL for DB-backed runtime use
- Current command split:
  - `npm run sync:pokedex` refreshes `data/pokedex.json`
  - `npm run sync:items` refreshes `data/item-catalog.json`
  - `npm run sync:moves` refreshes `data/move-catalog.json` and still depends on `data/pokedex.json`
  - `npm run db:seed:pokedex` imports the current local Pokemon snapshot
  - `npm run db:seed:items` imports the current local item snapshot
  - `npm run db:seed:moves` regenerates the move snapshot and imports it
- Default guidance:
  - use `db:migrate` + `db:seed:*` for normal runtime/bootstrap verification
  - use `sync:*` only when the task explicitly includes upstream dataset refresh

## Why This Is The Default Workflow
- Docker Compose manages container startup, not application schema state.
- Drizzle migrations are the source of truth for table structure.
- The seed/import script is the source of truth for initial catalog contents.
- This flow is repeatable across local, staging, and other fresh environments.

## Compose Automation Guidance
- Automatic DB population during `docker compose up` is possible, but it is not the current default.
- The simplest and most predictable workflow in this repo is still:
  - start DB with Compose
  - run migrations
  - run seed/import
- If automation is added later, prefer a dedicated init step that runs after PostgreSQL becomes healthy rather than relying on manual SQL drift.

## Current Catalog Strategy
- PostgreSQL currently stores:
  - snapshot-level metadata and payload
  - one catalog row per Pokemon
  - one catalog row per item
  - one catalog row per move
  - per-Pokemon move learnset rows
  - selected lookup columns plus full JSON payload
- This is a transitional catalog model, not a fully normalized long-term schema.
- `30-1` reclassifies the main normalization pressure points inside that transitional model:
  - duplicated lookup columns versus full payload storage in `pokemon_catalog`, `item_catalog`, and `move_catalog`
  - denormalized move/version/method metadata repeated inside `pokemon_move_catalog`
  - form-specific legality remaining outside the imported catalog schema
- `30-2` now narrows the first duplicated-field candidates:
  - Pokemon: slug/name/generation/type lookup columns versus the same concepts inside `PokemonSummary`
  - Item: slug/name/category/pocket lookup columns versus the same concepts inside `PokedexItem`
  - Move: slug/name/generation/type/damage-class/target lookup columns versus the same concepts inside `PokedexMove`
- `30-3` keeps reference-table extraction as a low-priority follow-up:
  - item category/pocket and move type/damage-class/target do not yet show enough independent lifecycle or reuse pressure to justify immediate table splits
  - if normalization continues later, duplicated learnset/form modeling is a higher-value target than these label-reference tables
- `30-4` keeps full form-aware learnset normalization out of the immediate plan:
  - the current national-dex-based `pokemon_move_catalog` is still acceptable for the present bounded form scope
  - broader schema work should wait until the supported form set and legality requirements exceed what the current override layer can safely carry
- `30-5` adds the current long-term direction draft:
  - team-member `formKey` is the current persistence hook, but longer-term normalization should promote it toward a stronger form identity model
  - any broader learnset legality redesign should key off that same form identity boundary rather than layering more per-dex overrides
- `30-6` adds a guardrail for future schema work:
  - list/detail/team/item/move runtime projections are now the minimum read-model contract
  - future normalization should preserve those server-side projections rather than pushing relational complexity into client code
- `30-7` adds the layer-separation rule:
  - import scripts own upstream snapshot-to-storage translation
  - runtime repository helpers own storage-to-read-model projection
  - client contracts should remain stable unless a read-model change is intentionally chosen
- `30-8` closes the current review with explicit non-goals and prerequisites:
  - non-goals: immediate broad rewrite, client-contract-first rewrite, full form-aware learnset rollout, wholesale reference-table split
  - prerequisites: fixed form/legality scope, fixed read-model contract, import/backfill plan, and migration/rollback order

## Current Domain Split
- Pokedex catalog:
  - runtime reads use `pokemon_catalog`
  - import lineage still uses `pokedex_snapshots`
  - upstream generation still starts from `data/pokedex.json`
- Item catalog:
  - runtime reads use `item_catalog`
  - import lineage still uses `item_snapshots`
  - upstream generation still starts from `data/item-catalog.json`
- Move catalog:
  - runtime reads use `move_catalog` and `pokemon_move_catalog`
  - import lineage still uses `move_snapshots`
  - upstream generation still starts from `data/move-catalog.json`
  - move snapshot generation still depends on `data/pokedex.json` to derive per-Pokemon move rows before import
- This means all three catalog domains are DB-first at runtime, but all three are still snapshot-first at generation/import time.
- `28-5` also clarifies the current sufficiency boundary:
  - the existing catalog tables are sufficient for current MVP item selection, move selection, saved `formKey`, and the current bounded form-specific move override layer
  - they are not yet a full solution for broader form-normalized learnset correctness across wider multi-form groups
- `28-6` leaves the current catalog indexes unchanged for now:
  - current slug keys and existing move-entry uniqueness are sufficient for the present runtime queries
  - likely first follow-up candidates, if load grows, are Korean-name search indexing on `pokemon_catalog`, filtered-list composite indexing around `snapshot_id` + generation, and wider move access-pattern review on `pokemon_move_catalog`

## Planned Domains

### Auth And Identity
- `users`
- `auth_accounts`
- `sessions`
- preferred first step: one minimal auth path with a server-managed authenticated session that can resolve `users.id`

### User-Owned Gameplay State
- `captured_pokemon`
- `favorite_pokemon`
- anonymous-session daily encounter and capture state before login

### Team Features
- `teams`
- `team_members`

### Catalog Expansion
- future normalized Pokemon catalog tables
- later expansion tables for items or other encyclopedia domains if needed

## Recommended Migration Order
1. Add auth and user-owned tables first
2. Expand the current anonymous daily persistence toward account-linked daily capture progress and favorites
3. Add team persistence
4. Revisit deeper catalog normalization only when runtime needs justify it

## Ownership Transition Direction
- The long-term target owner for user-state tables is `user_id`, not `anonymous_session_id`.
- Anonymous-session-backed state was acceptable as an MVP bridge, but it is no longer the preferred product direction for persisted features.
- Once real auth is verified, prefer making persistence features authenticated-only rather than designing around permanent dual ownership.
- Because the app is not currently operating with production user data, legacy anonymous-session records do not need a complex merge or migration plan.
- For the current planning scope, treat old anonymous-session records as disposable development-era data unless a later product requirement explicitly says otherwise.

## Current Ownership Scope
- Persisted runtime state now resolves through `user_id`.
- The active user-state tables are:
  - `daily_encounters`
  - `daily_captures`
  - `favorite_pokemon`
  - `teams`
  - `team_members`
- The affected runtime APIs are:
  - `app/api/daily/state/route.ts`
  - `app/api/favorites/state/route.ts`
  - `app/api/teams/state/route.ts`

## Target Ownership Model
- After auth work begins, the intended durable owner for user state is `users.id`.
- Daily capture progress, daily encounter state, and saved teams should be treated as user-owned data once a user is authenticated.
- Anonymous ownership should remain only as a temporary transition aid during implementation, not as the final primary ownership model.
- The desired steady state is:
  - authenticated writes -> `user_id`
  - unauthenticated user -> no persisted write path for favorites, daily, or teams
- `29-8` now also fixes the matching read-path rule:
  - unauthenticated user -> no persisted read path for favorites, daily/my-pokemon, or teams/my-teams
  - authenticated user -> persisted reads/writes resolve only through `user_id`

## Transition Decision
- The preferred transition is simple replacement for new authenticated flows, not complex historical merge logic.
- Once real provider-backed auth exists, favorites, daily/my-pokemon, and team state should be treated as auth-required persisted features written directly under `user_id`.
- Existing anonymous-session records do not need automatic migration just to unlock the auth design.
- If a future product requirement wants account-linking for anonymous pre-login progress, that should be treated as a separate feature rather than assumed by default.
- The preferred auth implementation shape is:
  - add a separate server-managed authenticated session
  - resolve `users.id` from the authenticated session
  - move persisted user-state reads/writes to `user_id` without requiring legacy anonymous merge

## Preferred Write Transition Order
- The first authenticated `user_id` write target should be `favorite_pokemon`.
- The next authenticated write target should be the daily/my-pokemon state pair because they already share one server-backed collection boundary.
- Team writes should follow after that because they have the broadest payload shape and the most save-time validation.
- This order keeps the first account-linked rollout focused on the smallest, lowest-risk state before expanding into more complex persisted flows.
- The runtime write path is now already simplified to authenticated `user_id` ownership across favorites, daily/my-pokemon, and teams.

## Ownership Transition Rules
- Do not block auth or ownership design on preserving old anonymous-session rows.
- Do not assume daily captures, encounters, or saved teams must be merged from anonymous state into user state.
- Prefer a clean `user_id` ownership model for persisted product features over a long-lived mixed ownership model.
- If a temporary bridge is ever needed, keep it explicit and short-lived rather than making `anonymous_session_id` and `user_id` co-equal permanent owners.
- Keep the transition plan focused on authenticated-only persistence, not on historical anonymous backfill.

## Likely DB Follow-Up Shape
- The anonymous-session bridge is no longer needed for the active schema.
- The next DB follow-up should focus on account features or deeper catalog work, not on preserving temporary anonymous ownership.

## Migration Rules
- Do not assume catalog normalization is the highest-priority DB task.
- Keep user-owned state separate from catalog data.
- Preserve compatibility with the current `PokemonSummary` payload shape until a deliberate schema migration is planned.
- Treat `features/pokedex/server/repository.ts` as the runtime truth when evaluating whether a DB plan is already live.
- Treat `user_id` as the only active durable owner for persisted product features.

## Out Of Scope Right Now
- completed user/auth schema implementation
- legacy anonymous-session data migration or merge design

## Near-Term TODO
- Add follow-up checks for migration application and local server restart behavior during DB-related development.
- Keep the current auth replacement work narrow:
  - preserve `users`, `auth_accounts`, and `sessions`
  - preserve the current-session read helper and `user_id` ownership resolver
  - replace only the development-only session issuance path with a real provider-backed sign-in/sign-out flow
- The first provider-backed target is now Google:
  - sign-in redirect starts at `/api/auth/sign-in`
  - callback lands at `/api/auth/callback/google`
  - successful callback should continue materializing local `sessions` rows so the existing ownership resolver keeps working unchanged
- The anonymous ownership cleanup is now also live at the schema layer:
  - `daily_captures`, `daily_encounters`, `favorite_pokemon`, and `teams` no longer keep `anonymous_session_id`
  - `anonymous_sessions` is removed
  - persisted product features now use only authenticated `user_id` ownership in both runtime and active schema

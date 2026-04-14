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
  - check schema with `db:migrate`
  - verify catalog data with `db:seed:*`

## Schema Definitions
- Source of truth for schema: `db/schema/`
- All active tables are defined in `db/schema/pokemon-catalog.ts`.
- Migrations are generated into `drizzle/`.

## Active Schema Tracking
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
- Prefer a clean `user_id` ownership model for persisted product features over a longlived mixed ownership model.
- If a temporary bridge is ever needed, keep it explicit and short-lived rather than making `anonymous_session_id` and `user_id` co-equal permanent owners.
- Keep the transition plan focused on authenticated-only persistence, not on historical anonymous backfill.

## Account Deletion Policy (Soft Delete)
- **Status Management:** Account deletion is handled via "Soft Delete" using `users.is_active` and `users.deleted_at`.
- **Inactivation:** When a user requests deletion, `is_active` is set to `false` and `deleted_at` is set to the current timestamp.
- **Session Blocking:** Inactive users must no longer resolve through the authenticated-session boundary. Existing `sessions` rows should be treated as invalid, and new authenticated sessions should not be issued while the account stays inactive.
- **Current Request Boundary:** The current MVP delete entry is `POST /api/account/delete`, which soft-deletes the authenticated user and clears active local sessions without purging related product data yet.
- **Grace-Period Recovery:** The current MVP recovery path is limited to re-login during the grace period. When `deleted_at` is still inside the recovery window, the same account can be reactivated and receive a new session instead of staying blocked.
- **Data Retention:** Related data (favorites, captures, teams) is kept intact during the inactive state to allow for potential account recovery within a grace period (e.g., 30 days).
- **Final Cleanup Trigger:** Once `deleted_at` is older than the grace period, the account becomes a purge candidate.
- **Purge Execution Shape:** The preferred purge action is deleting the `users` row in a background job or manual maintenance step, relying on existing `ON DELETE CASCADE` relationships to remove `auth_accounts`, `sessions`, `favorite_pokemon`, `daily_encounters`, `daily_captures`, `teams`, and downstream `team_members`.
- **Operational Order:** 1. Select inactive users whose `deleted_at` is older than 30 days. 2. Delete the matching `users` rows. 3. Record the maintenance outcome in ops notes or logs. 4. Recheck that the user can no longer authenticate and that persisted product rows are gone.
- **Current Product Scope:** This purge remains an operations task for now, not a user-facing immediate hard-delete button.

## User Data Reset Scope
- **Purpose:** User data reset is a separate account-management concept from account deletion. It keeps the authenticated account itself (`users`, `auth_accounts`, `sessions`) intact while clearing persisted gameplay data.
- **Reset Targets:** The current persisted gameplay scope is:
  - `favorite_pokemon`
  - `daily_encounters`
  - `daily_captures`
  - `teams`
  - `team_members`
- **Not Included In Reset:** Account identity, provider linkage, and login session records are not part of gameplay reset:
  - `users`
  - `auth_accounts`
  - `sessions`
- **Reset Modes:** The preferred future shape is four explicit reset scopes rather than one ambiguous destructive action:
  - favorites only
  - collection only (`daily_encounters` + `daily_captures`)
  - teams only (`teams` + `team_members`)
  - full gameplay reset (all three scopes together)
- **Execution Order:** The preferred deletion order is:
  1. `team_members`
  2. `teams`
  3. `daily_encounters`
  4. `daily_captures`
  5. `favorite_pokemon`
- **Why This Order:** Team rows have their own dependent rows, collection reset should clear both current encounter and captured history together, and favorites are fully independent so they can safely run last or alone.
- **Current Product Scope:** This reset remains policy/documentation only for now. A dedicated reset route or UI should be added only after the scope and confirmation UX are revisited.

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
  - preserve the current-session read helper and the direct `user_id` ownership boundary used by persisted-state APIs
  - replace only the development-only session issuance path with a real provider-backed sign-in/sign-out flow
- The first provider-backed target is now Google:
  - sign-in redirect starts at `/api/auth/sign-in`
  - callback lands at `/api/auth/callback/google`
  - successful callback should continue materializing local `sessions` rows so the existing direct `user_id` API ownership flow keeps working unchanged
- The anonymous ownership cleanup is now also live at the schema layer:
  - `daily_captures`, `daily_encounters`, `favorite_pokemon`, and `teams` no longer keep `anonymous_session_id`
  - `anonymous_sessions` is removed
  - persisted product features now use only authenticated `user_id` ownership in both runtime and active schema

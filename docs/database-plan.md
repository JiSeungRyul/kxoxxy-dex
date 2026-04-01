# Database Plan

## Purpose
- Define the future DB direction without restating the full current product or architecture.
- Keep migration strategy explicit while the repository remains hybrid.
- Keep the near-term ownership transition simple: this repository is not currently an operating production app, so legacy anonymous-session data migration does not need to drive the design.

## What Exists Today
- PostgreSQL is configured for local development.
- Drizzle configuration and initial catalog schema are present.
- Current catalog tables:
  - `pokedex_snapshots`
  - `pokemon_catalog`
  - `item_snapshots`
  - `item_catalog`
  - `move_snapshots`
  - `move_catalog`
  - `pokemon_move_catalog`
- Additional runtime tables are present for anonymous daily state:
  - `anonymous_sessions`
  - `daily_captures`
  - `daily_encounters`
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
Compose starts PostgreSQL, but the schema and catalog data still need to be applied.

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

## Planned Domains

### Auth And Identity
- `users`
- `auth_accounts`
- `sessions`

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
- Until auth exists, anonymous-session-backed state remains acceptable for local and MVP flows.
- Once auth is introduced, prefer writing new ownership-bound state directly to `user_id`-based records instead of designing around permanent dual ownership.
- Because the app is not currently operating with production user data, legacy anonymous-session records do not need a complex merge or migration plan.
- For the current planning scope, treat old anonymous-session records as disposable development-era data unless a later product requirement explicitly says otherwise.

## Current Anonymous Ownership Scope
- `anonymous_sessions` is the current owner lookup table for anonymous runtime state.
- `daily_encounters` and `daily_captures` are currently owned by `anonymous_session_id`.
- `teams` is currently owned by `anonymous_session_id`.
- `team_members` is currently owned indirectly through `teams.id`.
- The affected runtime APIs are:
  - `app/api/daily/state/route.ts`
  - `app/api/teams/state/route.ts`
- The current cookie boundary only identifies the anonymous session; it does not change the underlying owner model away from `anonymous_session_id`.

## Target Ownership Model
- After auth work begins, the intended durable owner for user state is `users.id`.
- Daily capture progress, daily encounter state, and saved teams should be treated as user-owned data once a user is authenticated.
- Anonymous ownership should remain only as a pre-login or no-auth fallback, not as the final primary ownership model.
- The desired steady state is:
  - authenticated writes -> `user_id`
  - anonymous fallback writes -> temporary anonymous owner only when auth is absent

## Transition Decision
- The preferred transition is simple replacement for new authenticated flows, not complex historical merge logic.
- Once auth exists, new daily/team state for authenticated users should be written directly under `user_id`.
- Existing anonymous-session records do not need automatic migration just to unlock the auth design.
- If a future product requirement wants account-linking for anonymous pre-login progress, that should be treated as a separate feature rather than assumed by default.

## Ownership Transition Rules
- Do not block auth or ownership design on preserving old anonymous-session rows.
- Do not assume daily captures, encounters, or saved teams must be merged from anonymous state into user state.
- Prefer a clean `user_id` ownership model for new writes over a long-lived mixed ownership model.
- If a temporary bridge is ever needed, keep it explicit and short-lived rather than making `anonymous_session_id` and `user_id` co-equal permanent owners.
- Keep the transition plan focused on future authenticated writes, not on historical anonymous backfill.

## Likely DB Follow-Up Shape
- `daily_captures` and `daily_encounters` will likely need a future `user_id` ownership path or successor tables tied to `users`.
- `teams` and `team_members` will likely need a future `user_id` ownership path or successor tables tied to `users`.
- The exact migration can stay minimal if legacy anonymous-session data is allowed to be dropped.
- The main planning task now is to document the target ownership boundary, not to preserve every temporary anonymous row.
- The likely minimum DB follow-up is one of these two approaches:
  - add nullable `user_id` ownership to the current daily/team tables, then switch authenticated writes to it
  - add successor user-owned tables and retire anonymous-owned tables later
- For this repo's current scope, either option is acceptable as long as `user_id` becomes the clear durable owner and anonymous ownership remains transitional.

## Migration Rules
- Do not assume catalog normalization is the highest-priority DB task.
- Keep user-owned state separate from catalog data.
- Preserve compatibility with the current `PokemonSummary` payload shape until a deliberate schema migration is planned.
- Treat `features/pokedex/server/repository.ts` as the runtime truth when evaluating whether a DB plan is already live.
- Treat the current anonymous daily tables as a bridge toward account-linked user state, not the final user-data model.
- Treat anonymous-session ownership as transitional and disposable unless a later requirement explicitly elevates data retention.

## Out Of Scope Right Now
- Auth.js integration
- completed user/auth schema implementation
- fully account-linked collection state
- team persistence
- favorites persistence
- legacy anonymous-session data migration or merge design

## Near-Term TODO
- Document the target `user_id` ownership boundary for daily and team state without over-designing legacy anonymous-session migration.
- Add follow-up checks for migration application and local server restart behavior during DB-related development.

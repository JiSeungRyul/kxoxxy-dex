# Database Plan

## Purpose
- Define the future DB direction without restating the full current product or architecture.
- Keep migration strategy explicit while the repository remains hybrid.

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
  - the generated move snapshot is local-only and should be recreated with `npm run sync:moves` before seeding on a fresh clone

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
5. Generate the local move snapshot:
   - `npm run sync:moves`
6. Import the local move snapshot into PostgreSQL:
   - `npm run db:seed:moves`
7. Start the app:
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
- `npm run sync:moves` regenerates the local move snapshot file from PokeAPI and the checked-in Pokemon snapshot.
- `npm run db:seed:moves` populates move tables from `data/move-catalog.json`.
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

## Migration Rules
- Do not assume catalog normalization is the highest-priority DB task.
- Keep user-owned state separate from catalog data.
- Preserve compatibility with the current `PokemonSummary` payload shape until a deliberate schema migration is planned.
- Treat `features/pokedex/server/repository.ts` as the runtime truth when evaluating whether a DB plan is already live.
- Treat the current anonymous daily tables as a bridge toward account-linked user state, not the final user-data model.

## Out Of Scope Right Now
- Auth.js integration
- completed user/auth schema implementation
- fully account-linked collection state
- team persistence
- favorites persistence

## Near-Term TODO
- Add a clear migration path from `anonymous_sessions` daily records to future `user_id`-based ownership.
- Add follow-up checks for migration application and local server restart behavior during DB-related development.

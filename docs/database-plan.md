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
- Import path:
  - `data/pokedex.json` -> `scripts/import-pokedex-to-db.mjs` -> PostgreSQL

## Current Catalog Strategy
- PostgreSQL currently stores:
  - snapshot-level metadata and payload
  - one catalog row per Pokemon
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

### Team Features
- `teams`
- `team_members`

### Catalog Expansion
- future normalized Pokemon catalog tables
- later expansion tables for items or other encyclopedia domains if needed

## Recommended Migration Order
1. Add auth and user-owned tables first
2. Move daily capture progress and favorites into PostgreSQL
3. Add team persistence
4. Revisit deeper catalog normalization only when runtime needs justify it

## Migration Rules
- Do not assume catalog normalization is the highest-priority DB task.
- Keep user-owned state separate from catalog data.
- Preserve compatibility with the current `PokemonSummary` payload shape until a deliberate schema migration is planned.
- Treat `features/pokedex/server/repository.ts` as the runtime truth when evaluating whether a DB plan is already live.

## Out Of Scope Right Now
- Auth.js integration
- completed user/auth schema implementation
- server-backed collection state
- team persistence
- favorites persistence

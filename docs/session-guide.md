# Session Guide

## One-line Summary
KxoxxyDex is a hybrid Pokedex app where list/detail routes are partially DB-backed,
while daily and collection features still rely on a local snapshot and browser state.

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

## Current Runtime Truth
- The repository is in a hybrid state.
- `/` and `/pokedex` load list data through PostgreSQL-backed catalog queries.
- `/pokemon/[slug]` loads detail data from PostgreSQL-backed catalog queries.
- `/daily` and `/my-pokemon` still load the full local snapshot from `data/pokedex.json`.
- Daily encounter progress and captured Pokemon state still live in `localStorage`.
- Snapshot generation still starts from PokeAPI and writes `data/pokedex.json`.
- PostgreSQL import still starts from `data/pokedex.json` and populates `pokedex_snapshots` and `pokemon_catalog`.

## Files To Verify First
- `app/page.tsx`
- `app/pokedex/page.tsx`
- `app/pokemon/[slug]/page.tsx`
- `app/daily/page.tsx`
- `app/my-pokemon/page.tsx`
- `features/pokedex/server/repository.ts`
- `features/pokedex/components/pokedex-page.tsx`
- `features/pokedex/types.ts`
- `scripts/sync-pokedex.mjs`
- `scripts/import-pokedex-to-db.mjs`

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
  - collection progress is still browser-local and separate from server data
- Doc drift:
  - architecture and product docs must be updated when runtime paths change

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

If the task depends on /daily, /my-pokemon, /teams, or their state APIs, read docs/verification-guide.md before changing the verification flow.

If the task depends on route or API performance measurement, read docs/performance-guide.md before changing the measurement workflow.

## Current Runtime Truth
- The repository is in a hybrid state.
- `/` and `/pokedex` load list data through PostgreSQL-backed catalog queries.
- `/pokemon/[slug]` loads detail data from PostgreSQL-backed catalog queries.
- `/daily` now loads a dex-number-only daily candidate index through PostgreSQL-backed catalog queries and fetches encounter/recent-capture detail on demand through `app/api/pokedex/catalog`.
- `/daily` stores anonymous-session encounter and capture state in PostgreSQL, including shiny flags.
- `/my-pokemon` now loads captured Pokemon detail on demand through `app/api/pokedex/catalog` after anonymous-session collection state is loaded, instead of shipping the gallery catalog on first render.
- `/my-pokemon` reads captured collection state through the same anonymous-session API used by daily.
- `/teams` now loads a small option list with dex number, Korean name, generation, and Pokedex-name metadata through PostgreSQL-backed catalog queries and fetches selected team-member detail on demand through `app/api/pokedex/catalog`.
- `/teams` and `/my-teams` read and write team data through anonymous-session-backed PostgreSQL APIs, including per-member level configuration.
- `/teams` now has a first-pass general form selector for Rotom appliance forms plus a small regional-form shortlist including `나옹(알로라/가라르)`, and the move API uses slot + `formKey` input so matching form-specific move overrides can be exposed where the current MVP supports them.
- Team persistence assumes the `teams` and `team_members` tables have been migrated and the local dev server has been restarted when Windows reload issues occur.
- Local `npm run start` measurement on 2026-03-26 showed first-response payload sizes of 478645 bytes for `/`, 25956 bytes for `/daily`, 21847 bytes for `/my-pokemon`, and 75230 bytes for `/teams`; see `docs/performance-guide.md` for the full dev/start table and method.
- Collection state is still mirrored into `localStorage` as a fallback compatibility layer.
- Snapshot generation still starts from PokeAPI and writes `data/pokedex.json`.
- Additional item and move snapshot generation now writes `data/item-catalog.json` and `data/move-catalog.json`.
- The generated move snapshot is local-only, and `npm run db:seed:moves` now regenerates it automatically before importing into PostgreSQL.
- PostgreSQL import still starts from local snapshot files and now populates `pokedex_*`, `item_*`, and `move_*` catalog tables.

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
  - collection progress is server-backed for anonymous sessions, but not yet account-linked
- Daily and team migration caveat:
  - the daily and team APIs depend on migrated anonymous-session tables and can fail until DB migrations are applied
- Local runtime caveat:
  - on Windows, DB-related changes may require a clean Next.js dev server restart because `.next/trace` locking can interfere with reload behavior
- Doc drift:
  - architecture and product docs must be updated when runtime paths change


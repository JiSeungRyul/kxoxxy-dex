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

If the task depends on local PostgreSQL, read `docs/database-plan.md` for the required startup order:
`docker compose up -d` -> `npm run db:migrate` -> `npm run db:seed:pokedex`.

## Current Runtime Truth
- The repository is in a hybrid state.
- `/` and `/pokedex` load list data through PostgreSQL-backed catalog queries.
- `/pokemon/[slug]` loads detail data from PostgreSQL-backed catalog queries.
- `/daily` now loads a collection-specific reduced Pokemon catalog payload through PostgreSQL-backed catalog queries.
- `/daily` stores anonymous-session encounter and capture state in PostgreSQL, including shiny flags.
- `/my-pokemon` now loads a slimmer collection-gallery Pokemon catalog payload through PostgreSQL-backed catalog queries.
- `/my-pokemon` reads captured collection state through the same anonymous-session API used by daily.
- `/teams` now loads a team-builder-specific reduced Pokemon catalog payload through PostgreSQL-backed catalog queries.
- `/teams` and `/my-teams` read and write team data through anonymous-session-backed PostgreSQL APIs, including per-member level configuration.
- Team persistence assumes the `teams` and `team_members` tables have been migrated and the local dev server has been restarted when Windows reload issues occur.
- Local measurement on 2026-03-24 showed that production responses for `/daily`, `/my-pokemon`, and `/teams` improved after the reduced-payload change, but each route still returns roughly 1.1 MB of HTML/Flight payload.
- Collection state is still mirrored into `localStorage` as a fallback compatibility layer.
- Snapshot generation still starts from PokeAPI and writes `data/pokedex.json`.
- PostgreSQL import still starts from `data/pokedex.json` and populates `pokedex_snapshots` and `pokemon_catalog`.

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





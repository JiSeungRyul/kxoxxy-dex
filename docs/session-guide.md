# Session Guide

## One-line Summary
KxoxxyDex is a Korean-first hybrid Pokedex app: runtime catalog reads are DB-backed, while snapshot generation and DB import still remain in the data pipeline.

## Purpose
- Start a new Codex session cheaply.
- Route the agent to only the docs that matter for the current task.
- Keep current runtime truth separate from historical notes.

## Project Identity
- Korean-first Pokemon encyclopedia MVP built on Next.js App Router.
- `features/pokedex` is the main product domain; keep `app/` thin.
- Runtime is hybrid:
  - PostgreSQL-backed catalog reads at runtime
  - snapshot generation and DB import still remain in the pipeline
- Persisted gameplay features are account-bound through authenticated `user_id`.
- This repo prefers minimal safe changes over broad refactors.

## Non-Negotiables
- Do not change MVP scope or core product behavior unless explicitly asked.
- Treat code as the final source of truth when docs drift.
- Preserve server/client boundaries and keep server data access in `features/pokedex/server/`.
- Keep Korean-first copy and existing architectural patterns.
- Do not assume the DB is available unless the task verifies that explicitly.

## Source Of Truth
- `features/pokedex/server/repository.ts` -> current runtime catalog read path
- `features/pokedex/types.ts` -> payload/schema contract
- `data/pokedex.json` -> local snapshot source for snapshot-backed import flows
- `scripts/sync-pokedex.mjs` -> snapshot refresh write path
- `docs/current-product.md` -> current user-facing behavior summary
- `docs/architecture.md` -> current runtime/data-flow summary
- `docs/database-plan.md` -> current DB/bootstrap/migration rules

## Start Here
1. Read `docs/project-overview.md` for product shape.
2. Read this file to choose the next document.
3. Read only the topic docs that match the task.

Do not default to reading every doc in `docs/`.

## Task-Based Read Order

### Product or UI scope
- Read `docs/current-product.md`.
- Use it for route scope, user-facing behavior, and MVP boundaries.

### Runtime data flow or architecture changes
- Read `docs/architecture.md`.
- Use it before changing server/client boundaries, repository reads, route data flow, or API shape.

### DB, migrations, seed, or local PostgreSQL setup
- Read `docs/database-plan.md`.
- Use it before assuming local DB state or changing schema/import workflow.

### Verification or smoke-check changes
- Read `docs/verification-guide.md`.
- Use it for `/favorites`, `/daily`, `/my-pokemon`, `/teams`, `/teams/random`, `/my-teams`, `/my`, and related APIs.

### Historical context only
- Read `docs/implemented-tasks.md` for completed work history.
- Read `docs/decision-log.md` for condensed historical decisions and review notes.
- Read these only when the current docs are not enough.

### Backlog planning only
- Read `docs/todo-backlog.md` for open work.
- Read `docs/todo-backlog-memo.md` only when detailed planning background is necessary.

## Current Runtime Truth
- The repository is still hybrid.
- `/`, `/pokedex`, and `/pokemon/[slug]` read catalog data from PostgreSQL.
- `/favorites`, `/daily`, `/my-pokemon`, `/teams`, and `/my-teams` use authenticated `user_id` ownership for persisted state.
- `/daily`, `/my-pokemon`, and `/teams` use reduced first-load payloads and fetch richer card/detail data on demand through catalog APIs.
- `/teams/random` is browse-only, uses the reduced team-builder option payload, and does not touch saved team state.
- Auth uses a server-managed local session boundary with Google provider mode when configured and a development fallback sign-in path otherwise.
- Soft-deleted inactive accounts are blocked at the auth-session boundary and fall back to signed-out behavior on protected views.
- Snapshot generation still writes `data/pokedex.json`, `data/item-catalog.json`, and `data/move-catalog.json`.
- Local DB runtime bootstrap is migrate first, then seed from current local snapshots; `sync:*` is only for intentional upstream refresh work.

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
- `app/api/daily/state/route.ts`
- `app/api/teams/state/route.ts`
- `app/api/account/delete/route.ts`
- `features/pokedex/server/repository.ts`
- `features/pokedex/server/auth-session.ts`
- `features/pokedex/types.ts`

## Working Constraints
- Prefer small, incremental changes over broad rewrites.
- Treat code as the final source of truth when docs drift.
- Keep `app/` thin and place feature logic in `features/pokedex/`.
- Preserve the server/client boundary:
  - server data access in `features/pokedex/server/`
  - interactive state in client components
- Do not describe the app as fully DB-backed or fully snapshot-backed.
- Keep the hybrid runtime model explicit when updating docs.
- Treat `features/pokedex/types.ts` as the payload contract for snapshot and catalog shapes.
- Do not assume the database is active unless the task explicitly verifies it.

## `.codexignore` Rule
- `.codexignore` is the default token-budget boundary for local Codex exploration.
- Keep source code, active docs, and current source-of-truth files readable unless there is a strong reason to exclude them.
- Add new local-only generated artifacts, caches, logs, or secret-bearing files to `.codexignore` in the same task that introduces them.
- A file in `.codexignore` can still be read when the user explicitly asks for it.

## Known Risks
- Hybrid drift: runtime reads and generation/import do not share the same source boundary.
- Environment coupling: `lib/db/client.ts` depends on `DATABASE_URL`.
- Historical drift: older docs or comments may still mention anonymous-session persistence even though runtime persistence is now account-bound.
- Windows dev-server restarts can still matter after DB-related changes because of `.next/trace` lock behavior.

## Quick Commands
- Local DB bootstrap:
  - `docker compose up -d`
  - `npm run db:migrate`
  - `npm run db:seed:pokedex`
  - `npm run db:seed:items`
  - `npm run db:seed:moves`
- Dataset refresh:
  - `npm run sync:pokedex`
  - `npm run sync:items`
  - `npm run sync:moves`

## Document Ownership Rules
- `docs/current-product.md` is the current user-facing behavior summary.
- `docs/architecture.md` is the current runtime/data-flow summary.
- `docs/database-plan.md` is the current DB/bootstrap/migration guide.
- `docs/verification-guide.md` is the current manual verification guide.
- `docs/implemented-tasks.md` and `docs/decision-log.md` are historical support docs, not first-read docs.

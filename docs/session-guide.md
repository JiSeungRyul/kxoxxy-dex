# Session Guide

## Purpose
- Give any new coding session enough context to make correct decisions quickly.
- Reduce drift between perceived architecture and actual runtime behavior.

## Read This First
1. `docs/current-product.md`
2. `docs/architecture.md`
3. `docs/database-plan.md`
4. `docs/implemented-tasks.md`

## Project Identity
- Product: `KxoxxyDex`
- Stack:
  - Next.js 15
  - React 19
  - TypeScript
  - Tailwind CSS
- Language direction:
  - Korean-first UI
- Current branch when this note was added:
  - `main`

## Current Truth
- The app is not fully database-backed yet.
- Live Pokedex catalog reads still come from `data/pokedex.json`.
- PostgreSQL, Drizzle, Docker Compose, and import scripts are present as migration groundwork.
- The current app should be treated as a hybrid-in-progress codebase.

## What Is Already Working
- Main Pokedex browsing routes
- Pokemon detail route
- Light / dark mode toggle
- Local collection-related routes:
  - `/daily`
  - `/my-pokemon`
- Local PostgreSQL setup and initial catalog import tooling

## What Is Not Fully Integrated Yet
- Authentication
- User-backed persistence
- Runtime catalog reads from PostgreSQL
- Locale / multi-language switching
- Automated tests

## Highest-Priority Structural Risks
1. Runtime source confusion
   - Do not assume DB-backed reads are live just because DB files exist.
2. Large payload and weak responsiveness
   - The current JSON snapshot is large enough to cause slow initial render and hydration pressure.
3. Client-side scaling limits
   - Search, filter, sort, and pagination are still client-heavy.
4. Local-only gameplay state
   - `localStorage` state will become a migration problem when auth is added.
5. Docs can drift during rapid iteration
   - Architecture changes should be recorded immediately after implementation.

## Rules For Future Sessions
- Before making data-layer changes, confirm the live read path in `features/pokedex/server/repository.ts`.
- Before saying the project is `frontend + DB`, verify that the runtime routes actually read from DB.
- Treat user-owned state and catalog state as separate domains.
- Prefer small, targeted changes over broad rewrites unless a migration step is explicitly planned.
- If a feature depends on auth, server persistence, or DB queries, document the server boundary in the same task.

## Practical Next Steps
- Improve list-route performance before expanding more client-heavy features.
- Move user-owned state to PostgreSQL before migrating the full catalog read path.
- Introduce login through Next.js server-side auth flow rather than a separate backend by default.
- Add a language model only after text ownership is clearly separated from UI structure.

## Files That Matter Most
- `app/page.tsx`
- `app/pokedex/page.tsx`
- `app/pokemon/[slug]/page.tsx`
- `features/pokedex/server/repository.ts`
- `features/pokedex/components/pokedex-page.tsx`
- `data/pokedex.json`
- `lib/db/client.ts`
- `docs/architecture.md`
- `docs/current-product.md`
- `docs/database-plan.md`

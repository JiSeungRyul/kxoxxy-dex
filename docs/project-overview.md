# Project Overview

## When To Read This
- Read this first when you need a compact overview of product scope, stack, and hybrid model.
- Use this as orientation only; route behavior and data flow details live in the more specific docs.

## What This Project Is
- `KxoxxyDex` is a Korean-first Pokemon encyclopedia product built with Next.js.
- The repository is centered on the `features/pokedex` domain.
- The current product is a desktop-first MVP with supporting mobile responsiveness, not a finished platform.

## Long-Term Direction
- Keep the Pokedex experience as the core browsing surface.
- Expand into account-backed user features such as captured Pokemon history, favorites, and team building.
- Move toward a cleaner separation between catalog data, user-owned state, and future operational content.
- As the migration continues, clarify the runtime boundary into a frontend UI layer, a server/API layer, and a PostgreSQL-backed data layer, while still keeping snapshot generation and import in the data pipeline during the current hybrid phase.

## MVP Scope
- Browse Pokemon list data
- Search by Korean name
- Filter by type and generation
- Sort by dex number, name, and base stats
- Navigate paginated results
- View Pokemon detail pages with forms, evolution, abilities, and matchup references
- Save and browse login-required favorite Pokemon
- Use login-required daily encounter and captured-Pokemon collection flows
- Build and browse login-required Pokemon teams
- Use the account hub for profile, summary, and account-management entry points
- Try the lightweight browse-only random team experience
- Use light and dark theme modes

## Tech Stack
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- PostgreSQL
- Drizzle ORM
- PokeAPI for snapshot generation

## Data Model Summary
- `data/pokedex.json` is the generated local catalog snapshot.
- PostgreSQL is used for current runtime list, detail, daily, and my-pokemon catalog flows.
- The repository is currently in a hybrid migration stage:
  - runtime routes and catalog APIs already use PostgreSQL-backed catalog queries
  - snapshot generation and DB import still remain in the pipeline as the upstream content-generation path
- `28-1` clarified the current boundary:
  - hybrid no longer mainly means “runtime files vs runtime DB”
  - it now mainly means “DB-backed runtime reads vs snapshot-based generation/import pipeline”
- `28-2` clarified the per-domain split:
  - pokedex/item/move runtime reads are already PostgreSQL-backed
  - pokedex/item/move generation and import still begin from snapshot files
  - move generation remains the most snapshot-coupled because it also reads the Pokemon snapshot when constructing learnset data
- `28-7` closes the documentation pass:
  - `project-overview`, `architecture`, `current-product`, and `session-guide` now all describe the same current hybrid model
  - current persisted gameplay features are account-bound at runtime, while catalog generation/import remains snapshot-first
- As the migration continues, API-derived catalog data is expected to be stored in PostgreSQL.

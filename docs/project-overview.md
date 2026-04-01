# Project Overview

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
- Use anonymous-session-backed daily encounter and captured-Pokemon collection flows
- Build and browse anonymous-session-backed Pokemon teams
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
  - runtime routes use PostgreSQL-backed catalog queries
  - snapshot generation and DB import still remain in the pipeline
- As the migration continues, API-derived catalog data is expected to be stored in PostgreSQL.

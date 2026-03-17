# Project Overview

## What This Project Is
- `KxoxxyDex` is a Korean-first Pokemon encyclopedia product built with Next.js.
- The repository is centered on the `features/pokedex` domain.
- The current product is a desktop-first MVP with supporting mobile responsiveness, not a finished platform.

## Long-Term Direction
- Keep the Pokedex experience as the core browsing surface.
- Expand into account-backed user features such as captured Pokemon history, favorites, and team building.
- Move toward a cleaner separation between catalog data, user-owned state, and future operational content.

## MVP Scope
- Browse Pokemon list data
- Search by Korean name
- Filter by type and generation
- Sort by dex number, name, and base stats
- Navigate paginated results
- View Pokemon detail pages with forms, evolution, abilities, and matchup references
- Use local daily encounter and local captured-Pokemon collection flows
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
- PostgreSQL is partially used for current runtime list and detail queries, while other routes still rely on the local snapshot.
- The repository is currently in a hybrid migration stage:
  - some routes read from PostgreSQL-backed catalog queries
  - some routes still read directly from the local snapshot
- As the migration continues, API-derived catalog data is expected to be stored in PostgreSQL.

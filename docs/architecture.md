# Architecture

## Current Truth
- Runtime application state is still centered on Next.js App Router plus a file-backed snapshot.
- The live Pokedex read path is `app/* -> features/pokedex/server/repository.ts -> data/pokedex.json`.
- PostgreSQL and Drizzle groundwork exist, but the live catalog read path has not been migrated to the database yet.
- The project should currently be described as:
  - `Next.js frontend + Next server runtime + JSON-backed catalog`
  - not yet `frontend + database-backed application`

## High-Level Structure
- `app/`
  - Next.js App Router entry points and layout
- `features/pokedex/`
  - Pokedex domain types, constants, UI, and server snapshot access
- `features/theme/`
  - Theme toggle UI
- `features/site/`
  - Reusable site-level informational UI
- `data/pokedex.json`
  - Prebuilt Pokemon dataset snapshot
- `scripts/sync-pokedex.mjs`
  - Snapshot generation script using PokeAPI
- `lib/db/`
  - Shared PostgreSQL connection layer for future database-backed features
- `db/schema/`
  - Reserved location for future Drizzle schema definitions
- `drizzle.config.ts`
  - Drizzle Kit configuration for future migrations

## Runtime Flow
1. `app/page.tsx` calls `getPokedexSnapshot()`
2. `features/pokedex/server/repository.ts` reads `data/pokedex.json`
3. The dataset is passed into `PokedexPage`
4. `PokedexPage` manages UI state for search, filters, sorting, and pagination
5. `PokedexTable` renders the current page of Pokemon
6. Clicking a row navigates to `/pokemon/[slug]`
7. `app/pokemon/[slug]/page.tsx` resolves the Pokemon from the same snapshot and renders `PokemonDetailPage`

## Architectural Risks To Track First
- Runtime source ambiguity:
  - DB files exist, but runtime catalog reads still come from `data/pokedex.json`
  - future work must not assume the app is already DB-backed
- Heavy initial payload:
  - the snapshot file is large and the list routes currently load the catalog through the snapshot path
  - this is the leading suspect for slow first render and weak interactivity
- Client-heavy catalog processing:
  - filtering, sorting, and pagination still happen against the in-memory dataset in the client
  - this will not scale cleanly once login, user data, and richer catalog features are added
- Local-only user state:
  - collection progress currently depends on `localStorage`
  - once login is added, this state must move behind authenticated server writes
- Mixed migration phase:
  - DB schema, import scripts, and runtime code are not yet aligned around one source of truth
  - new work should explicitly state whether it targets snapshot mode, hybrid mode, or DB mode

## Data Layer
- Source file: `features/pokedex/server/repository.ts`
- Snapshot path: `data/pokedex.json`
- Development mode:
  - reads snapshot directly from disk
- Production mode:
  - uses `unstable_cache`
  - cache key: `pokedex-snapshot`
  - revalidate interval: 24 hours

## Database Preparation Layer
- Source file: `lib/db/client.ts`
- Connection style:
  - PostgreSQL via `postgres` driver
  - Drizzle ORM wrapper for future schema-based access
- Status:
  - connection layer is present
  - initial catalog schema and migrations are present for snapshot storage
  - `scripts/import-pokedex-to-db.mjs` imports `data/pokedex.json` into PostgreSQL
  - runtime Pokedex reads still use `data/pokedex.json`

## Near-Term Migration Rule
- Until repository reads are moved, `features/pokedex/server/repository.ts` remains the effective runtime source of truth.
- DB work should first target:
  - auth and user-owned state
  - capture history
  - favorites
  - teams
- Catalog migration should happen only after the list/detail read strategy is intentionally redesigned.

## Client State
- Source file: `features/pokedex/components/pokedex-page.tsx`
- Managed state:
  - search term
  - selected type
  - selected generation
  - sort key
  - sort direction
  - current page
- Search input uses `useDeferredValue`
- Filtering and sorting are recalculated from the full dataset on each relevant state change

## Domain Utilities
- Source file: `features/pokedex/utils.ts`
- Main responsibilities:
  - label formatting
  - dex number formatting
  - generation / type label formatting
  - height / weight / experience formatting
  - defensive matchup calculation
  - combined filter + sort processing
  - collection-state sanitization helpers

## UI Composition
- `PokedexControls`
  - hero area with logo, title, theme toggle
  - search / type / generation filters
  - result summary and reset action
- `PokedexTable`
  - sortable table
  - row click navigation
  - empty state
- `PokedexPagination`
  - page navigation and visible range summary
- `PokemonDetailPage`
  - artwork and form tabs
  - base profile stats
  - media blocks
  - evolution flow
  - defensive type matchup analysis

## Theme Model
- Theme bootstrapping script is embedded in `app/layout.tsx`
- `localStorage` key: `kxoxxy-theme`
- HTML root gets `dark` class when the saved theme is `dark`

## Deployment Direction
- Local development:
  - preferred database runtime is Docker-based PostgreSQL
- Initial production deployment target:
  - app hosting on Vercel
  - managed PostgreSQL on Neon or Supabase
  - authentication handled in-app through Auth.js
- Reasoning:
  - preserves strong compatibility with the existing Next.js App Router setup
  - keeps database operations on standard PostgreSQL rather than a custom backend abstraction
  - supports starting with credentials-based login and later adding Kakao login through the same auth layer
- Intended migration path:
  - keep `data/pokedex.json` as the runtime source for Pokemon catalog data during the early service phase
  - move user-specific state such as captured Pokemon, daily encounters, teams, and auth/session data into PostgreSQL first
  - move operationally edited content such as localized ability descriptions into the database only when admin workflows are needed

## Residual Collection Model In Code
- Source type: `PokedexCollectionState`
- Fields:
  - `capturedDexNumbers`
  - `encountersByDate`
- These helpers remain in `features/pokedex/utils.ts`, but there is no active route in the current workspace that uses them

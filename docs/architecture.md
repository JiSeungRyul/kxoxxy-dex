# Architecture

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

## Runtime Flow
1. `app/page.tsx` calls `getPokedexSnapshot()`
2. `features/pokedex/server/repository.ts` reads `data/pokedex.json`
3. The dataset is passed into `PokedexPage`
4. `PokedexPage` manages UI state for search, filters, sorting, and pagination
5. `PokedexTable` renders the current page of Pokemon
6. Clicking a row navigates to `/pokemon/[slug]`
7. `app/pokemon/[slug]/page.tsx` resolves the Pokemon from the same snapshot and renders `PokemonDetailPage`

## Data Layer
- Source file: `features/pokedex/server/repository.ts`
- Snapshot path: `data/pokedex.json`
- Development mode:
  - reads snapshot directly from disk
- Production mode:
  - uses `unstable_cache`
  - cache key: `pokedex-snapshot`
  - revalidate interval: 24 hours

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

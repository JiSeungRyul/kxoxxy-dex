# Implemented Tasks

## Purpose
- Keep a historical record of completed work.
- Record what has been built without redefining the full current architecture.

## Core Pokedex Browsing
- Implemented the main Pokedex browsing routes
- Added Korean-name search
- Added type and generation filters
- Added sorting by dex number, name, and base stats
- Added pagination
- Added table-based browsing and empty states

## Pokemon Detail Experience
- Implemented `/pokemon/[slug]`
- Added previous/next navigation
- Added form switching
- Added shiny artwork toggle
- Added base stat presentation
- Added grouped regional Pokedex reference display
- Added representative Pokedex flavor text display
- Added evolution path rendering, including branching and special-form follow-ups
- Added defensive matchup presentation
- Added cry playback and footprint display
- Added ability and hidden-ability presentation with temporary Korean description support

## Data Pipeline
- Implemented `scripts/sync-pokedex.mjs`
- Added local snapshot generation into `data/pokedex.json`
- Added dedicated repository logic for snapshot and catalog access
- Added initial PostgreSQL catalog import flow through `scripts/import-pokedex-to-db.mjs`

## Site Chrome And Supporting Pages
- Added shared layout in `app/layout.tsx`
- Added theme bootstrap and theme toggle
- Added footer with service, policy, and resource links
- Added `/contact`
- Added `/terms`
- Added `/privacy`

## Collection-Oriented Features
- Added `/daily`
- Added `/my-pokemon`
- Added local collection-state helpers for captured Pokemon and daily encounter tracking
- Added anonymous-session PostgreSQL persistence for daily encounter and capture state
- Moved My Pokemon collection reads onto the same anonymous-session-backed server state used by daily
- Added shiny encounter/capture state for daily and release support in My Pokemon
- Added client-side mirroring of daily server state back into local collection storage for hybrid compatibility

## Team Builder (Updated: 2026-03-23)
- Added `/teams` for building teams from the full catalog
- Added `/my-teams` for browsing, editing, and deleting saved teams
- Added anonymous-session-backed PostgreSQL storage for teams and team members
- Added level configuration and level-based battle stat display for team members
- Added the `0003_team_builder` and `0004_team_member_level` migrations and Drizzle schema entries
- Hardened team save/load handling so saved member level is preserved and saved team reads stay aligned to the latest catalog snapshot
- Verified the local team flow with `npm run typecheck`, `npm run db:migrate`, and route/API smoke checks for `/teams`, `/my-teams`, and `/api/teams/state` on 2026-03-23

## Database Groundwork
- Added local PostgreSQL Docker Compose setup
- Added environment template for database configuration
- Added shared DB client in `lib/db/client.ts`
- Added Drizzle configuration
- Added initial catalog schema and migration files

## Planned Follow-Up Areas
- Authentication
- Server-backed user persistence
- Team builder
  - Add stronger server-managed session ownership beyond the current browser-scoped anonymous session
- Favorites
  - Allow favorite toggling from the Pokemon list UI
  - Allow favorite toggling from Pokemon detail pages
  - Add a dedicated favorites view for browsing saved favorite Pokemon
  - Prefer a direct navigation entry for favorites during the current MVP stage instead of a broader my-page shell
- Further DB integration beyond the current hybrid stage
- Replace anonymous browser-scoped session ownership with account-linked ownership later

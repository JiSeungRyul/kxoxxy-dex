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

## Team Builder (Updated: 2026-03-25)
- Added `/teams` for building teams from the full catalog
- Added `/my-teams` for browsing, editing, and deleting saved teams
- Added anonymous-session-backed PostgreSQL storage for teams and team members
- Added level configuration and level-based battle stat display for team members
- Added the `0003_team_builder` and `0004_team_member_level` migrations and Drizzle schema entries
- Hardened team save/load handling so saved member level is preserved and saved team reads stay aligned to the latest catalog snapshot
- Split the reduced route payloads so `/daily` and `/my-pokemon` load collection-specific catalog fields while `/teams` loads only the team-builder fields it needs
- Slimmed `/my-pokemon` again so it no longer receives daily-only catalog fields such as generation and stats
- Reworked `/daily` so the first render now ships only daily candidate dex numbers and fetches encounter/recent-capture detail on demand through `app/api/pokedex/catalog/route.ts`
- Reworked `/teams` so the first render now ships only dex-number-and-name option entries and fetches selected team-member detail on demand through `app/api/pokedex/catalog/route.ts`
- Reworked `/my-pokemon` so the first render now ships no gallery catalog and fetches captured-card detail on demand through `app/api/pokedex/catalog/route.ts`
- Verified the route payload restructuring with `npm run typecheck`, `npm run build`, and local smoke checks for `/daily`, `/my-pokemon`, `/teams`, `/api/daily/state`, `/api/teams/state`, and `/api/pokedex/catalog` on 2026-03-25

## Database Groundwork
- Added local PostgreSQL Docker Compose setup
- Added environment template for database configuration
- Added shared DB client in `lib/db/client.ts`
- Added Drizzle configuration
- Added initial catalog schema and migration files

## Workflow Guardrails (Added: 2026-03-25)
- Added a pre-commit documentation rule in AGENTS.md
- The rule requires documenting task changes in docs/ before running git add, git commit, or git push
- This keeps implementation notes, reasons for change, and behavior updates recorded before git history is advanced
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

## UI And UX Backlog (Added: 2026-03-24)

### Pokemon Detail Page
- Fix broken Korean text in the gender-ratio display
- Fix broken Korean text in the defensive-matchup multiplier display

### Daily And My Pokemon
- Rework the Daily Encounter background art and overall Pokemon scene styling for the main encounter CTA area
- Improve My Pokemon gallery alignment so a single captured Pokemon does not stay left-aligned on wide screens
- Keep My Pokemon responsive so the gallery centers cleanly and wraps downward as the viewport narrows
- Aim for a wide-layout presentation that visually groups around five cards per row before wrapping when space allows

### Team Builder
- Add search-based Pokemon selection in addition to the current select control
- Consider moving ability selection to a dropdown in a later step
- Consider adding searchable item selection plus dropdown support later
- Check whether move selection can use Pokemon-specific learnable move dropdowns later
- Show which stat is raised and lowered when a nature is selected
- Prevent EV inputs from exceeding the total cap during editing and add stronger over-cap feedback around the `510 / 510` indicator
- Rebalance the layout so base stats, IVs, and EVs align more cleanly with the upper content blocks instead of feeling left-heavy
- Rebalance the layout for nature, item, and ability controls in the same way
- Move My Teams under the Team Builder navigation as a child option and rename the creation action to a clearer label than the current wording


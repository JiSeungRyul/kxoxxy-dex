# KxoxxyDex Task Tracker

This document is for local project tracking and planning.

Status rule:

- `TODO`: not started
- `IN PROGRESS`: currently being worked on
- `DONE`: completed
- `BLOCKED`: waiting on a decision or dependency

## 1. Project Goal

Build KxoxxyDex as a Pokemon information hub starting from a desktop-first Pokedex MVP.

Current MVP scope:

- Korean-first UI
- Search by Pokemon name
- Filter by type
- Filter by generation
- Sort by National Dex number, name, and core stats
- Pagination
- Local snapshot data generated from PokeAPI

## 2. Current Snapshot

### Completed

- `DONE` Next.js App Router project initialized
- `DONE` Pokedex list page MVP implemented
- `DONE` PokeAPI snapshot sync script implemented
- `DONE` Local dataset generation into `data/pokedex.json`
- `DONE` Search/filter/sort controls implemented
- `DONE` Pagination implemented
- `DONE` UI translated to Korean
- `DONE` Korean Pokemon names pulled from PokeAPI species data
- `DONE` Animated pixel sprite images pulled from PokeAPI sprite sources
- `DONE` Table layout refined for desktop
- `DONE` Table centered with wider spacing and larger Pokemon images
- `DONE` Type badges restyled as color-coded rounded tags by Pokemon type
- `DONE` Brand image moved into `public/brand/kxoxxy.jpg`
- `DONE` Header logo applied
- `DONE` Favicon connected
- `DONE` Basic README created for local run guidance
- `DONE` Tailwind content scan updated to include `features/**`
- `DONE` Dev mode snapshot loading changed to avoid stale cache during local work
- `DONE` `PROJECT_TASKS.md` added for ongoing task tracking

### Known Issues / Gaps

- `TODO` Production build lock issue on Windows when `.next/trace` is held by another Node process
- `TODO` ESLint is not configured yet
- `TODO` No automated test suite yet
- `TODO` No deployment target configured yet
- `TODO` No environment/version pinning files yet
- `TODO` Some files appear to have encoding/display inconsistencies in terminal output and should be normalized

## 3. Active Product Tasks

### Pokedex UX

- `TODO` Make table responsive for mobile and tablet layouts
- `TODO` Improve filter bar layout for smaller screens
- `TODO` Define a mobile-friendly alternative to the desktop table, likely card/list view
- `TODO` Add loading, empty, and error states with tighter UX consistency
- `TODO` Review typography and spacing system for Korean UI polish
- `TODO` Decide whether generation should remain filter-only or also be visible in row details
- `TODO` Decide whether users should be able to switch between animated sprites and official artwork
- `TODO` Add a clearer visual hierarchy for stat columns if the table remains desktop-first

### Data Quality

- `TODO` Audit Korean Pokemon names for edge cases and special forms
- `TODO` Decide how to handle alternate forms, mega evolutions, regional variants, and special cases
- `TODO` Decide whether type labels inside `data/pokedex.json` should also be localized during sync
- `TODO` Add validation around snapshot generation failures
- `TODO` Add fallback handling when animated sprite URLs are missing or broken
- `TODO` Decide whether to store both `animatedImageUrl` and `artworkImageUrl` instead of one merged `imageUrl`

### Feature Expansion

- `TODO` Plan Pokemon detail page structure
- `TODO` Define route strategy for Pokemon detail pages
- `TODO` Design future game info section
- `TODO` Design future community feature boundaries

## 4. Engineering Tasks

### Code Quality

- `TODO` Configure ESLint for the project
- `TODO` Add consistent formatting strategy
- `TODO` Review current file encoding and Windows compatibility
- `TODO` Add lightweight code quality checks before commit
- `TODO` Add a safer pre-push verification flow for typecheck, build, and data sync changes

### Testing

- `TODO` Add at least one smoke test path for the Pokedex page
- `TODO` Add tests for filter and sort logic in `features/pokedex/utils.ts`
- `TODO` Add tests for pagination behavior
- `TODO` Add tests for snapshot sync behavior where practical

### Runtime / Build Stability

- `TODO` Investigate and document `.next/trace` lock issue on Windows
- `TODO` Standardize local development workflow when dev server is already running
- `TODO` Add Node.js version guidance file such as `.nvmrc` or equivalent
- `TODO` Document how local cache behavior differs between development and production

## 5. Deployment / Operations

### Near Term

- `TODO` Choose first deployment target
- `TODO` Verify production build in a clean environment
- `TODO` Add deployment checklist
- `TODO` Decide whether deployment should serve the prebuilt snapshot only or support periodic sync jobs

### Future Docker Compose Direction

These are not required yet, but should shape upcoming architecture decisions.

- `TODO` Keep app structure compatible with future `docker-compose.yml`
- `TODO` Prepare for `app` service + `db` service split
- `TODO` Add `.env.example` once runtime configuration is introduced
- `TODO` Add `Dockerfile` when deployment/container flow is decided
- `TODO` Add `docker-compose.yml` when database work starts

### Database Future Work

- `TODO` Decide database choice when data stops being snapshot-only
- `TODO` Define what should remain static snapshot data vs database-backed data
- `TODO` Plan migration path from file snapshot to DB-backed content where needed

## 6. Suggested Next Order

Recommended next sequence:

1. Normalize file encoding and fix any remaining Korean text corruption in source files
2. Configure ESLint
3. Fix or document Windows build lock behavior
4. Add mobile-responsive Pokedex layout
5. Add basic automated tests
6. Prepare deployment target
7. Introduce Docker Compose only when database requirements become real

## 7. Notes

- This file is intended as a working task tracker.
- It should be kept in sync with major product and engineering decisions.

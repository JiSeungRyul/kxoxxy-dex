# Current Product

## Snapshot
- Project name: `KxoxxyDex`
- App type: desktop-first Korean Pokemon encyclopedia MVP
- Main route: `/`
- Data source: local snapshot in `data/pokedex.json`
- Snapshot metadata:
  - source: `pokeapi`
  - syncedAt: `2026-03-15T11:21:16.121Z`
  - totalPokemon: `1025`

## Implemented Routes
- `/`
  - Main Pokedex page
  - Search, filter, sort, pagination
- `/pokemon/[slug]`
  - Pokemon detail page
  - Form switching, evolution path, type matchup, media sections
- `/contact`
  - Contact / inquiry page
- `/terms`
  - Terms page
- `/privacy`
  - Privacy policy page

## Current Product Scope
- Korean UI
- Pokemon list browsing from a prebuilt JSON snapshot
- Search by Korean name
- Filter by type
- Filter by generation
- Sort by dex number, name, and base stats
- Paginated table view
- Detail page per Pokemon
- Light / dark theme toggle
- Footer with service / policy / resource links

## Explicitly Present In Code Now
- Client-side Pokedex interaction lives in `features/pokedex/components/pokedex-page.tsx`
- Data loading is snapshot-based and file-backed
- Pokemon detail data is read from the same snapshot, not from live API calls
- Collection-related utility types still exist in code:
  - `capturedDexNumbers`
  - `encountersByDate`
- However, daily encounter / my-pokemon routes are not present in the current workspace

## Out Of Scope In Current Workspace
- Database
- Authentication
- Server-side user state
- API routes for gameplay state
- Automated tests

## Planned Next Features
- Login
- Database integration
- Team maker
- Random team picker

## Known Constraints
- `next/font/google` is used in `app/layout.tsx`, so restricted network environments can affect build behavior
- The app depends on `data/pokedex.json` being present and valid
- Filtering and sorting run on the full in-memory dataset on the client

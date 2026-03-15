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
- `/pokedex`
  - Dedicated Pokedex route
  - Same core browsing experience as the main route
- `/daily`
  - Daily encounter view
  - Local collection-state interaction
- `/my-pokemon`
  - Captured Pokemon gallery view
  - Local collection-state interaction
- `/pokemon/[slug]`
  - Pokemon detail page
  - Form switching, shiny toggle, previous/next navigation, evolution path, type matchup, media sections, grouped Pokedex references
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
- Form-aware detail page with regional / mega / gigantamax switching
- Hero artwork toggle for normal / shiny presentation
- Ability table with temporary frontend-held Korean description support
- Grouped regional Pokedex number display with representative Pokedex flavor text
- Light / dark theme toggle
- Footer with service / policy / resource links

## Explicitly Present In Code Now
- Client-side Pokedex interaction lives in `features/pokedex/components/pokedex-page.tsx`
- Data loading is snapshot-based and file-backed
- Pokemon detail data is read from the same snapshot, not from live API calls
- Collection-related utility types and routes are active:
  - `capturedDexNumbers`
  - `encountersByDate`
  - `/daily`
  - `/my-pokemon`

## Out Of Scope In Current Workspace
- Database
- Authentication
- Server-side user state
- API routes for gameplay state
- Automated tests

## Planned Next Features
- Login
- Database integration
- Move temporary frontend-held Korean ability description data into the database
- Team maker
- Random team picker

## Known Constraints
- `next/font/google` is used in `app/layout.tsx`, so restricted network environments can affect build behavior
- The app depends on `data/pokedex.json` being present and valid
- Filtering and sorting run on the full in-memory dataset on the client

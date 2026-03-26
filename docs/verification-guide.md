# Verification Guide

## Purpose
- Provide a lightweight manual verification flow for the DB-backed daily, collection, and team routes.
- Keep the checks aligned with the current hybrid runtime where first render payloads are reduced and detail loads happen on demand.

## Scope
- Routes:
  - `/daily`
  - `/my-pokemon`
  - `/teams`
- APIs:
  - `/api/daily/state`
  - `/api/teams/state`
  - `/api/pokedex/catalog`

## Preconditions
- Local PostgreSQL is running and seeded:
  1. `docker compose up -d`
  2. `npm run db:migrate`
  3. `npm run db:seed:pokedex`
- The app is running locally:
  - `npm run dev`
  - or `npm run start`
- If daily or team DB changes were applied on Windows, restart the local Next.js server before smoke checks.

## Session Keys Used By The Current Client
- Daily and My Pokemon share `localStorage["kxoxxy-daily-anonymous-session"]`.
- Daily and My Pokemon still mirror collection fallback data into `localStorage["kxoxxy-pokedex-collection"]`.
- Teams and My Teams share `localStorage["kxoxxy-anonymous-session"]`.

## Recommended Baseline Check
- Run `npm run typecheck` before manual smoke checks when the task changed route, API, or repository code.
- Run `npm run build` when the task changed data delivery, caching, or route-server behavior.

## Route Smoke Flow

### `/daily`
- Open `/daily` in a clean browser session.
- Confirm the page renders without a server error before any interaction.
- Confirm the browser creates or reuses `kxoxxy-daily-anonymous-session`.
- Confirm the client requests:
  - `GET /api/daily/state?sessionId=...`
  - `GET /api/pokedex/catalog?view=daily&dexNumbers=...`
- Confirm the main encounter card appears after the state request completes.
- Click capture and confirm:
  - `POST /api/daily/state` with `action: "capture"` succeeds
  - the encounter shows as captured
  - the recent-capture list updates
- Click reroll before capture on a fresh session and confirm:
  - `POST /api/daily/state` with `action: "reroll"` succeeds
  - the encounter changes
- Click reset after capture and confirm:
  - `POST /api/daily/state` with `action: "reset"` succeeds
  - the captured state for today clears

### `/my-pokemon`
- Use the same browser session used for `/daily`.
- Open `/my-pokemon`.
- Confirm the page renders without shipping a gallery catalog on first render.
- Confirm the client requests:
  - `GET /api/daily/state?sessionId=...`
  - `GET /api/pokedex/catalog?view=my-pokemon&dexNumbers=...` only when captured dex numbers exist
- Confirm captured cards render after the collection state loads.
- Release one captured Pokemon and confirm:
  - `POST /api/daily/state` with `action: "release"` succeeds
  - the card disappears from the gallery
  - the released dex number is removed from the mirrored collection state

### `/teams`
- Open `/teams` in a clean browser session.
- Confirm the page renders without a server error.
- Confirm the browser creates or reuses `kxoxxy-anonymous-session`.
- Confirm the first render ships only team-builder option entries, not the full selected-detail catalog.
- Select one or more Pokemon and confirm the client requests:
  - `GET /api/teams/state?sessionId=...`
  - `GET /api/pokedex/catalog?view=teams&dexNumbers=...` after selection
- Save a team and confirm:
  - `POST /api/teams/state` with `action: "save"` succeeds
  - the route updates to `/teams?teamId=...`
  - refreshing the page keeps the saved team loaded
- Delete the saved team from `/my-teams` or through the API and confirm it disappears on reload.

## API Smoke Flow

### `/api/daily/state`
- Missing session id should return `400` from `GET` and `POST`.
- Valid `GET` should return a `PokedexCollectionState`-shaped payload:
  - `capturedDexNumbers`
  - `shinyCapturedDexNumbers`
  - `encountersByDate`
  - `shinyEncountersByDate`
- Valid `POST` actions are:
  - `capture`
  - `reset`
  - `reroll`
  - `release`
- `release` must include `nationalDexNumber` or return `400`.

### `/api/teams/state`
- Missing session id should return `400` from `GET` and `POST`.
- Valid `GET` should return `{ "teams": [...] }`.
- Valid `POST` actions are:
  - `save`
  - `delete`
- `save` must include a team name and member array or return `400`.
- `delete` must include `teamId` or return `400`.

### `/api/pokedex/catalog`
- Invalid `view` should return `400`.
- Empty or invalid `dexNumbers` should return `{ "pokemon": [] }`.
- Valid views are:
  - `daily`
  - `my-pokemon`
  - `teams`
- Expected payload shapes by view:
  - `daily`: `PokemonCollectionCatalogEntry[]`
  - `my-pokemon`: `PokemonCollectionPageEntry[]`
  - `teams`: `PokemonTeamBuilderCatalogEntry[]`

## Example API Checks
- Replace the session id placeholder before running the commands.

```powershell
curl.exe "http://localhost:3000/api/daily/state?sessionId=replace-me"
curl.exe "http://localhost:3000/api/pokedex/catalog?view=daily&dexNumbers=25,133"
curl.exe "http://localhost:3000/api/teams/state?sessionId=replace-me"
```

```powershell
curl.exe -X POST "http://localhost:3000/api/daily/state" -H "Content-Type: application/json" -d '{"sessionId":"replace-me","action":"reroll"}'
curl.exe -X POST "http://localhost:3000/api/teams/state" -H "Content-Type: application/json" -d '{"sessionId":"replace-me","action":"delete","teamId":1}'
```

## Payload-Split Regression Checks
- `/daily` should still receive only daily candidate dex numbers on first render, then fetch encounter and recent-capture detail through `/api/pokedex/catalog`.
- `/my-pokemon` should still ship no gallery catalog on first render, then fetch captured-card detail through `/api/pokedex/catalog`.
- `/teams` should still receive only dex-number-and-name option entries on first render, then fetch selected detail through `/api/pokedex/catalog`.

## When To Re-Run This Flow
- After changing `features/pokedex/server/repository.ts`
- After changing `/daily`, `/my-pokemon`, `/teams`, or their related APIs
- After changing cache helpers tied to reduced first-load payloads
- After applying DB migrations for daily, collection, or team tables
- After restarting the local server to recover from Windows `.next/trace` lock issues

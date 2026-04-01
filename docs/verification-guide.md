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
  - `/api/pokedex/moves`

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
- Daily and My Pokemon still mirror collection fallback data into `localStorage["kxoxxy-pokedex-collection"]`.
- The daily and team state APIs now also issue or reuse a shared `httpOnly` cookie named `kxoxxy-anonymous-session`.
- Older browsers may still carry a legacy `localStorage["kxoxxy-anonymous-session"]` value, but the current client only forwards it during the first state load so the server can migrate that browser onto the cookie boundary.

## Recommended Baseline Check
- Run `npm run typecheck` before manual smoke checks when the task changed route, API, or repository code.
- Run `npm run build` when the task changed data delivery, caching, or route-server behavior.


## Post-Migration Daily And Team Smoke Flow
- Use this flow immediately after DB schema changes that affect daily, collection, or team persistence.
- Run the steps in order:
  1. `docker compose up -d`
  2. `npm run db:migrate`
  3. `npm run db:seed:pokedex` when the local catalog may be empty or stale
  4. Restart the local Next.js server before route checks on Windows
  5. Run the route and API checks below with fresh session ids
- Minimum route checks after migration:
  - Open `/daily`
  - Open `/teams`
  - Open `/my-teams`
- Minimum API checks after migration:
  - `GET /api/daily/state`
  - `POST /api/daily/state` with `action: "reroll"`
  - `GET /api/teams/state`
  - `POST /api/teams/state` with `action: "save"`
  - `POST /api/teams/state` with `action: "delete"`
- Minimum success signals after migration:
  - `/daily` renders and returns a state payload with at least one encounter date for a fresh session
  - `/teams` renders, allows a team save, and keeps the saved team on refresh
  - `/my-teams` renders the saved team list for the same session
  - deleting the saved team removes it from `/my-teams` and from `GET /api/teams/state`

## Failure Triage After Migration
- If `/daily` or `/teams` fails immediately after a migration:
  - confirm `docker compose up -d` completed successfully
  - rerun `npm run db:migrate`
  - rerun `npm run db:seed:pokedex` if catalog-backed reads may be empty
  - restart the local Next.js server before retrying on Windows
- If `/api/daily/state` fails:
  - confirm `anonymous_sessions`, `daily_encounters`, and `daily_captures` exist
  - confirm `DATABASE_URL` points at the expected local PostgreSQL instance
- If `/api/teams/state`, `/teams`, or `/my-teams` fails:
  - confirm `teams` and `team_members` exist
  - confirm the same anonymous session id is being reused across `/teams` and `/my-teams`
- If route HTML loads but the UI does not behave correctly:
  - check the matching state API first
  - then check `/api/pokedex/catalog` for the follow-up detail payload

## Route Smoke Flow

### `/daily`
- Open `/daily` in a clean browser session.
- Confirm the page renders without a server error before any interaction.
- Confirm the browser receives or reuses the `kxoxxy-anonymous-session` `httpOnly` cookie.
- Confirm the client requests:
  - `GET /api/daily/state`
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
  - `GET /api/daily/state`
  - `GET /api/pokedex/catalog?view=my-pokemon&dexNumbers=...` only when captured dex numbers exist
- Confirm captured cards render after the collection state loads.
- Release one captured Pokemon and confirm:
  - `POST /api/daily/state` with `action: "release"` succeeds
  - the card disappears from the gallery
  - the released dex number is removed from the mirrored collection state

### `/teams`
- Open `/teams` in a clean browser session.
- Confirm the page renders without a server error.
- Confirm the browser receives or reuses the `kxoxxy-anonymous-session` `httpOnly` cookie.
- Confirm the first render ships only the reduced team-builder option payload, not the full selected-detail catalog.
  - The reduced payload now includes dex number, Korean name, generation, and Pokedex-name metadata for conservative format-based candidate narrowing.
- Select one or more Pokemon and confirm the client requests:
  - `GET /api/teams/state`
  - `GET /api/pokedex/catalog?view=teams&dexNumbers=...` after selection
  - `GET /api/pokedex/moves?slots=...&dexNumbers=...&formKeys=...&format=...` after selection
- Save a team and confirm:
  - `POST /api/teams/state` with `action: "save"` succeeds
  - the route updates to `/teams?teamId=...`
  - refreshing the page keeps the saved team loaded
- With the move selector enabled, also confirm:
  - the move API returns move options for the selected Pokemon and current format
  - saving a valid move set succeeds
  - saving duplicate moves inside the same member slot fails with a validation error
- With Rotom selected, also confirm:
  - the `일반 폼` selector appears
  - choosing `히트`, `워시`, `프로스트`, `스핀`, or `커트` updates the visible type badges and artwork
  - the matching signature move becomes selectable only for the matching form
  - saving and reloading the team preserves the selected Rotom form
- With Giratina or Shaymin selected, also confirm:
  - the `일반 폼 선택` selector appears
  - choosing `오리진폼` or `스카이폼` updates the visible artwork, type badges, and ability list
  - saving and reloading the team preserves the selected form
- With Tauros selected, also confirm:
  - the `일반 폼 선택` selector appears
  - choosing `팔데아 컴뱃종`, `팔데아 블레이즈종`, or `팔데아 아쿠아종` updates the visible artwork, type badges, and ability list
  - saving and reloading the team preserves the selected breed
- Delete the saved team from `/my-teams` or through the API and confirm it disappears on reload.

## API Smoke Flow

### `/api/daily/state`
- First request without a cookie should still succeed because the route can issue a fresh anonymous-session cookie.
- Missing `sessionId` should no longer return `400` when a valid cookie is present or the route needs to mint a fresh cookie.
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
- First request without a cookie should still succeed because the route can issue a fresh anonymous-session cookie.
- Missing `sessionId` should no longer return `400` when a valid cookie is present or the route needs to mint a fresh cookie.
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

### `/api/pokedex/moves`
- Missing or invalid slot-member input should return `{ "pokemonMoves": [] }`.
- Valid requests should return `{ "pokemonMoves": [...] }`.
- The current request shape is parallel slot-member input:
  - `slots`
  - `dexNumbers`
  - `formKeys`
- The current `format` parameter is expected to be one of:
  - `default`
  - `gen6`
  - `gen7`
  - `gen8`
  - `gen9`
- The response should include slot-grouped move options for the selected Pokemon in the requested format.
- Rotom appliance forms should include the matching form-specific signature move when the corresponding `formKey` is provided.
- Duplicate move validation is enforced at save time through `/api/teams/state`.

## Example API Checks
- Replace the session id placeholder before running the commands.

```powershell
curl.exe -c cookiejar.txt "http://localhost:3000/api/daily/state"
curl.exe "http://localhost:3000/api/pokedex/catalog?view=daily&dexNumbers=25,133"
curl.exe -b cookiejar.txt "http://localhost:3000/api/teams/state"
curl.exe "http://localhost:3000/api/pokedex/moves?slots=1&dexNumbers=479&formKeys=heat&format=gen9"
```

```powershell
curl.exe -b cookiejar.txt -X POST "http://localhost:3000/api/daily/state" -H "Content-Type: application/json" -d '{"action":"reroll"}'
curl.exe -b cookiejar.txt -X POST "http://localhost:3000/api/teams/state" -H "Content-Type: application/json" -d '{"action":"delete","teamId":1}'
```

## Payload-Split Regression Checks
- `/daily` should still receive only daily candidate dex numbers on first render, then fetch encounter and recent-capture detail through `/api/pokedex/catalog`.
- `/my-pokemon` should still ship no gallery catalog on first render, then fetch captured-card detail through `/api/pokedex/catalog`.
- `/teams` should still receive only the reduced team-builder option payload on first render, then fetch selected detail through `/api/pokedex/catalog`.
- `/teams` move requests should stay on-demand and slot-aware, with Rotom `formKey` included only when a Rotom appliance form is selected.

## When To Re-Run This Flow
- After changing `features/pokedex/server/repository.ts`
- After changing `/daily`, `/my-pokemon`, `/teams`, or their related APIs
- After changing cache helpers tied to reduced first-load payloads
- After applying DB migrations for daily, collection, or team tables
- After restarting the local server to recover from Windows `.next/trace` lock issues

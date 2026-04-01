# Performance Guide

## Purpose
- Standardize repeatable local performance re-measurement for the key DB-backed routes and APIs.
- Keep payload-size and first-response timing checks consistent after route-payload, caching, or API-delivery changes.

## Scope
- Pages:
  - `/`
  - `/daily`
  - `/my-pokemon`
  - `/teams`
- APIs:
  - `/api/daily/state`
  - `/api/teams/state`
- Optional follow-up API:
  - `/api/pokedex/catalog`

## Preconditions
- PostgreSQL is running and seeded:
  1. `docker compose up -d`
  2. `npm run db:migrate`
  3. `npm run db:seed:pokedex`
- `DATABASE_URL` points at the local PostgreSQL instance.
- If Windows `.next/trace` locking blocks `npm run dev`, stop the stale Next.js node process and restart before measuring.

## Measurement Conventions
- Use `curl.exe` against a local server and record:
  - `http_code`
  - `size_download`
  - `time_starttransfer`
  - `time_total`
- Treat `npm run start` as the primary comparison baseline for payload and first-response changes.
- Treat `npm run dev` as a secondary local-debug baseline only.
  - Dev timings are noisier because route compilation and hot-reload overhead can dominate the first request.
- Use fresh session ids for `/api/daily/state` and `/api/teams/state` so the requests are repeatable.
- Keep the optional `/api/pokedex/catalog` spot check small and deterministic.
  - Example: `view=teams&dexNumbers=25`

## Recommended Sequence
1. Run `npm run build` after meaningful route, repository, or caching changes.
2. Start a dedicated local server for measurement.
3. Measure the fixed route/API target set with `curl.exe`.
4. Record the results in this document and, when needed, update summary notes in `docs/session-guide.md` and `docs/architecture.md`.
5. Run the lightweight smoke flow from `docs/verification-guide.md` when a change touched DB-backed runtime behavior.

## Example Commands

### Dev
```powershell
cmd.exe /c "set PORT=3002 && npm run dev"
```

```powershell
curl.exe -s -o NUL -w "dev|%{url_effective}|%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}`n" --max-time 30 http://localhost:3002/
curl.exe -s -o NUL -w "dev|%{url_effective}|%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}`n" --max-time 30 http://localhost:3002/daily
curl.exe -s -o NUL -w "dev|%{url_effective}|%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}`n" --max-time 30 http://localhost:3002/my-pokemon
curl.exe -s -o NUL -w "dev|%{url_effective}|%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}`n" --max-time 30 http://localhost:3002/teams
curl.exe -s -c cookiejar-dev.txt -o NUL -w "dev|%{url_effective}|%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}`n" --max-time 30 http://localhost:3002/api/daily/state
curl.exe -s -b cookiejar-dev.txt -o NUL -w "dev|%{url_effective}|%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}`n" --max-time 30 http://localhost:3002/api/teams/state
```

### Start
```powershell
npm run build
cmd.exe /c "set PORT=3003 && npm run start"
```

```powershell
curl.exe -s -o NUL -w "start|%{url_effective}|%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}`n" --max-time 30 http://localhost:3003/
curl.exe -s -o NUL -w "start|%{url_effective}|%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}`n" --max-time 30 http://localhost:3003/daily
curl.exe -s -o NUL -w "start|%{url_effective}|%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}`n" --max-time 30 http://localhost:3003/my-pokemon
curl.exe -s -o NUL -w "start|%{url_effective}|%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}`n" --max-time 30 http://localhost:3003/teams
curl.exe -s -c cookiejar-start.txt -o NUL -w "start|%{url_effective}|%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}`n" --max-time 30 http://localhost:3003/api/daily/state
curl.exe -s -b cookiejar-start.txt -o NUL -w "start|%{url_effective}|%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}`n" --max-time 30 http://localhost:3003/api/teams/state
```

## Latest Local Measurements

### 2026-03-26 `npm run dev`
| Target | Status | Bytes | TTFB (s) | Total (s) |
| --- | ---: | ---: | ---: | ---: |
| `/` | 200 | 493197 | 0.984055 | 1.672366 |
| `/daily` | 200 | 53248 | 0.409289 | 0.566198 |
| `/my-pokemon` | 200 | 47967 | 0.244292 | 0.289798 |
| `/teams` | 200 | 550873 | 0.369319 | 2.337530 |
| `/api/daily/state` | 200 | 137 | 15.835357 | 15.837024 |
| `/api/teams/state` | 200 | 12 | 6.614212 | 6.615500 |
| `/api/pokedex/catalog?view=teams&dexNumbers=25` | 200 | 658 | 2.288293 | 2.289662 |

### 2026-03-26 `npm run start`
| Target | Status | Bytes | TTFB (s) | Total (s) |
| --- | ---: | ---: | ---: | ---: |
| `/` | 200 | 478645 | 0.160630 | 0.746049 |
| `/daily` | 200 | 25956 | 0.060412 | 0.060583 |
| `/my-pokemon` | 200 | 21847 | 0.029587 | 0.029745 |
| `/teams` | 200 | 75230 | 0.051039 | 0.058715 |
| `/api/daily/state` | 200 | 137 | 0.160287 | 0.161541 |
| `/api/teams/state` | 200 | 12 | 0.048877 | 0.050057 |
| `/api/pokedex/catalog?view=teams&dexNumbers=25` | 200 | 658 | 0.068823 | 0.070075 |

## Reading The Results
- Compare `start` measurements first when evaluating route payload changes.
- Use `dev` measurements mainly to spot large regressions or unusually slow local rebuild paths.
- The `/daily`, `/my-pokemon`, and `/teams` `start` HTML sizes remain aligned with the reduced first-load payload work.
- The `/` route remains much larger because it still serves the main catalog browsing experience.
- State API payload sizes stay very small; if timings spike while bytes stay flat, suspect local DB or dev-server startup overhead before assuming payload regression.

## When To Re-Run
- After changing `features/pokedex/server/repository.ts`
- After changing route-entry payload shapes for `/`, `/daily`, `/my-pokemon`, or `/teams`
- After changing `app/api/daily/state`, `app/api/teams/state`, or `app/api/pokedex/catalog`
- After changing cache behavior that affects first response size or latency
- After meaningful DB query or anonymous-session state changes

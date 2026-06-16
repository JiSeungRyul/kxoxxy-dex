# KxoxxyDex

Korean-first Pokédex built with Next.js 16, PostgreSQL, and a PokeAPI snapshot pipeline. Includes Google OAuth, a daily encounter system, a competitive team builder, and a personal Pokémon collection.

---

## Features

**Browse**
- National Pokédex with search (Korean name), type filter, generation filter
- Sorting by National Dex number, name, and all six battle stats
- Paginated list and individual detail pages with evolution chains, forms, and Pokédex entries

**Account (Google sign-in required)**
- Favorites — bookmark Pokémon across sessions
- Daily encounter — one new Pokémon per day, capturable to your collection
- My Pokémon — personal capture collection with shiny tracking
- Team builder — build and save competitive teams with format rules (Gen 6–9), gimmick constraints (Mega, Z-Move, Dynamax, Gigantamax, Terastal), move legality, and IV/EV spreads
- My Teams — manage saved teams

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5, React 19 |
| Database | PostgreSQL 16 |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| DB driver | postgres-js |
| Auth | Custom Google OAuth 2.0 (no NextAuth) |
| Styling | Tailwind CSS 3 |
| Data source | PokeAPI (build-time snapshot) |
| Process manager (prod) | PM2 |
| Local DB | Docker Compose |

---

## Architecture Overview

Data flows in one direction and is never fetched from PokeAPI at runtime:

```
PokeAPI
  └─ scripts/sync-*.mjs          (build-time: fetch + normalize + localize)
       └─ data/pokedex.json       (committed snapshot)
            └─ scripts/import-*-to-db.mjs   (seed: TRUNCATE → INSERT into PostgreSQL)
                 └─ features/pokedex/server/repository.ts   (runtime: SQL reads only)
                      └─ app/*/page.tsx + app/api/*/route.ts
```

**Key design choices:**
- Catalog rows store frequently queried fields (`name_ko`, `generation_id`, `primary_type`) as real columns for SQL filtering/sorting, plus the full object in a `payload jsonb` column for rendering — no JOIN overhead, no schema churn.
- All catalog reads are scoped to the latest `pokedex_snapshots` row by `snapshot_id`, so a re-import swaps the entire catalog atomically in one transaction.
- Sessions are stored in a `sessions` table (random UUID token, 30-day expiry) — immediate invalidation on account deactivation or deletion.
- Accounts support soft-delete with a 30-day recovery window.

---

## Local Setup

### Requirements

- Node.js 22 LTS
- npm 10+
- Docker (for local PostgreSQL via Compose)

### Quick Start

**1. Install dependencies**

```bash
npm install
```

**2. Create local environment file**

```bash
cp .env.example .env
```

**3. Start PostgreSQL**

```bash
docker compose up -d
```

PowerShell:
```powershell
docker compose up -d
```

**4. Apply migrations and seed the catalog**

```bash
sh scripts/setup-local-db.sh --skip-compose
```

PowerShell:
```powershell
.\scripts\setup-local-db.ps1 -SkipCompose
```

Or run Compose + bootstrap in one step:

```bash
sh scripts/setup-local-db.sh
# PowerShell: .\scripts\setup-local-db.ps1
```

**5. Start the dev server**

```bash
npm run dev
```

Open `http://localhost:3000`.

> **Auth in development:** Google OAuth is not required locally. When `AUTH_PROVIDER` is unset, a development fallback session is used automatically. This fallback is blocked in production.

---

## Available Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start development server (webpack, port 3000) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run lint` | ESLint |
| `npm run test` | Node built-in test runner (`.test.mjs` files) |
| `npm run sync:pokedex` | Rebuild `data/pokedex.json` from PokeAPI |
| `npm run sync:items` | Rebuild item catalog snapshot |
| `npm run sync:moves` | Rebuild move catalog snapshot |
| `npm run db:generate` | Generate Drizzle migration files after schema changes |
| `npm run db:migrate` | Apply pending Drizzle migrations |
| `npm run db:seed:pokedex` | Import `data/pokedex.json` into PostgreSQL |
| `npm run db:seed:items` | Import item catalog into PostgreSQL |
| `npm run db:seed:moves` | Sync and import move catalog into PostgreSQL |
| `npm run db:studio` | Open Drizzle Studio (local DB browser) |

> `sync:*` and `db:seed:*` are not part of the normal deploy pipeline. Run them only when an intentional catalog refresh is needed.

---

## Project Structure

```
app/                          Next.js App Router (routing + data fetch only)
  api/auth/                   Sign-in, sign-out, session, Google OAuth callback
  api/favorites/              Favorites state API
  api/daily/                  Daily encounter state API
  api/teams/                  Team state API
  api/pokedex/                Catalog and move option APIs
  pokemon/[slug]/             Pokémon detail page
  teams/, my-teams/           Team builder and saved teams
  daily/, favorites/          Daily encounter and favorites pages
  my/, my-pokemon/            Account hub and personal collection

features/pokedex/
  server/
    repository.ts             All DB reads and writes (SQL via postgres-js)
    auth-session.ts           Google OAuth flow, session management
    list-page.ts              Search-param → query adapter
  components/                 React client components
  types.ts                    Shared TypeScript contracts
  utils.ts                    Pure logic (encounter selection, team normalization)
  constants.ts                Type labels, generation labels, per-page count

db/schema/pokemon-catalog.ts  Drizzle schema (all tables)
drizzle/                      Migration files (drizzle-kit output)
scripts/
  sync-pokedex.mjs            PokeAPI → data/pokedex.json
  sync-items.mjs              PokeAPI → data/item-catalog.json
  sync-moves.mjs              PokeAPI → move snapshot
  import-pokedex-to-db.mjs   JSON snapshot → PostgreSQL
  import-items-to-db.mjs     Item snapshot → PostgreSQL
  import-moves-to-db.mjs     Move snapshot → PostgreSQL
  setup-local-db.sh           Local bootstrap (migrate + seed)
  setup-local-db.ps1          PowerShell equivalent
data/
  pokedex.json                Committed Pokémon snapshot
  item-catalog.json           Committed item snapshot
lib/db/client.ts              postgres-js client singleton
```

---

## Production Deployment

The app runs as a single Next.js process alongside PostgreSQL on one server (VPS). There is no separate frontend/backend split.

**Required environment variables:**

```env
DATABASE_URL=postgresql://...

# Google OAuth (all five required to enable provider auth)
AUTH_PROVIDER=google
AUTH_URL=https://yourdomain.com
AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

**Deploy flow (automated via GitHub Actions on push to `main`):**

```bash
git pull origin main
npm ci --prefer-offline
npm run build
npm run db:migrate
pm2 restart kxoxxy-dex
```

Schema migrations run on every deploy. Catalog re-seeding (`db:seed:*`) is a separate manual operation, not part of the default pipeline.

---

## Data Source

Pokémon data is fetched from [PokéAPI](https://pokeapi.co) at build time only. The sync script:

- fetches species, forms, abilities, evolution chains, egg groups, and Pokédex entries in batches of 40
- resolves Korean (primary), Japanese, and English names with fallback priority
- normalizes evolution conditions and form labels into Korean
- writes a deterministic `data/pokedex.json` snapshot that is committed to the repository

The app never calls PokéAPI at runtime.

---

## Windows Notes

- Use PowerShell or Windows Terminal.
- If `npm run build` fails because `.next` files are locked, stop any running Node processes for this project first.
- PowerShell equivalents for all shell scripts are provided in `scripts/setup-local-db.ps1`.

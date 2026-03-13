# KxoxxyDex

KxoxxyDex is a desktop-first Pokemon encyclopedia MVP built with Next.js, TypeScript, and Tailwind CSS.

The current app provides:

- Korean UI
- Korean Pokemon names sourced from PokeAPI species data
- Search, type filter, generation filter
- Sorting by National Dex number, name, and battle stats
- Pagination

## Tech Stack

- Node.js
- npm
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- PokeAPI

## Local Requirements

To run this project locally, you need:

- Node.js 22 LTS recommended
- npm 10 or newer recommended
- Internet access when running `npm run sync:pokedex`

This project does not currently require:

- a database
- environment variables
- Docker

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open the app:

```text
http://localhost:3000
```

## Production Run

Build and run the app locally in production mode:

```bash
npm run build
npm run start
```

If the build fails on Windows because `.next/trace` is locked, stop any running Next.js or Node processes for this project and try again.

## Available Scripts

- `npm run dev`: start development server
- `npm run build`: create production build
- `npm run start`: run production server
- `npm run typecheck`: run TypeScript type check
- `npm run sync:pokedex`: rebuild `data/pokedex.json` from PokeAPI

## Data Source

Pokemon list data is generated into:

```text
data/pokedex.json
```

The sync script:

- fetches Pokemon data from PokeAPI
- fetches species data to resolve Korean Pokemon names
- writes a local snapshot used by the app

To refresh the snapshot:

```bash
npm run sync:pokedex
```

## Project Structure

```text
app/                         Next.js App Router entry
features/pokedex/            Pokedex feature code
features/pokedex/components/ UI components
features/pokedex/server/     Data loading logic
data/pokedex.json            Cached Pokemon snapshot
scripts/sync-pokedex.mjs     Snapshot sync script
public/brand/                Static brand assets
```

## Windows Notes

- Use PowerShell or Windows Terminal
- If `npm run build` fails because `.next` files are locked, terminate existing Node processes running this project first
- If ports are already in use, stop the existing dev server before starting a new one

## Docker Compose Direction

This project is intentionally kept simple right now, but it is being prepared for future Docker Compose usage when a database is introduced.

Recommended future structure:

- `app` service: Next.js application
- `db` service: PostgreSQL or another database
- optional `adminer` or `pgadmin` service for local database inspection

Recommended future files:

- `Dockerfile`
- `docker-compose.yml`
- `.env.example`

Until a database is added, running the app directly with Node.js is the simplest and most reliable approach.

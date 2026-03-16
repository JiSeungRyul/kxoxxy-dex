# Database Plan

## Goal
- Prepare the app for PostgreSQL-backed auth and user-owned data
- Expand the schema in stages while keeping the current runtime stable

## Current Direction
- Database engine:
  - PostgreSQL
- Local runtime:
  - Docker Compose via `compose.yaml`
- App-side access:
  - Drizzle ORM with `postgres` driver
- Auth direction:
  - credentials login first
  - Kakao login later through the same auth layer

## Current Implemented Catalog Layer
- Implemented tables:
  - `pokedex_snapshots`
  - `pokemon_catalog`
- Purpose:
  - `pokedex_snapshots` stores imported snapshot metadata and the top-level snapshot payload
  - `pokemon_catalog` stores one row per Pokemon with selected lookup columns plus full per-Pokemon payload
- Import flow:
  - source file remains `data/pokedex.json`
  - import script is `scripts/import-pokedex-to-db.mjs`
  - local migration workflow uses Drizzle
- Verified local result:
  - `pokedex_snapshots = 1`
  - `pokemon_catalog = 1025`
- Current constraint:
  - app runtime still reads from `data/pokedex.json`
  - PostgreSQL catalog storage exists in parallel and is not yet the live read path

## Planned Domains

### 1. User information and login
- Core user profile data
- Login credentials and account linkage
- Session or token persistence
- Design note:
  - separate user identity from login provider details so Kakao can be added later without changing domain tables

### 2. My Pokemon
- Store Pokemon captured by the user
- Initial use case:
  - save Pokemon caught from the daily Pokemon flow
- Design note:
  - keep this as event-like user-owned data rather than mixing it into the catalog table

### 3. Pokemon information
- Create database-backed Pokemon catalog tables based on `data/pokedex.json`
- Expect schema growth over time as more Pokemon attributes and related data are added
- Future related domains may include:
  - items
  - tools
  - additional gameplay or encyclopedia entities
- Design note:
  - prefer a stable core Pokemon table first, then split auxiliary tables as columns become too broad or sparse

### 4. Team builder
- Save user-created Pokemon teams
- Initial use case:
  - let a logged-in user save teams created from the team builder page
- Design note:
  - keep team metadata separate from team slot membership rows

### 5. Favorites
- Let users bookmark favorite Pokemon from the Pokedex
- Design note:
  - model this as a user-to-Pokemon relation rather than a flag on the Pokemon catalog

## Recommended Table Groups
- Auth group:
  - `users`
  - `auth_accounts`
  - `sessions`
- User activity group:
  - `captured_pokemon`
  - `favorite_pokemon`
- Team group:
  - `teams`
  - `team_members`
- Catalog group:
  - `pokemon`
  - related detail tables to be added later as the snapshot is normalized

## Migration Order
1. Add auth and user-owned tables first
2. Move daily capture and favorites into PostgreSQL
3. Add team persistence
4. Normalize `pokedex.json` into catalog tables only when the write/read needs justify it
5. Add items and other expansion tables later

## Out Of Scope For This Step
- Auth.js integration
- User/auth tables
- Team tables
- Favorite tables
- Daily capture tables

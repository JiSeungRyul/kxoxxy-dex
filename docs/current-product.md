# Current Product

## Product Snapshot
- Product name: `KxoxxyDex`
- Product type: Korean-first Pokemon encyclopedia MVP
- Primary routes:
  - `/`
  - `/pokedex`
  - `/pokemon/[slug]`
  - `/daily`
  - `/my-pokemon`

## User-Facing Features
- Main Pokedex browsing with search, type filter, generation filter, sorting, and pagination
- Pokemon detail pages with:
  - form switching
  - shiny artwork toggle
  - previous/next navigation
  - base stats
  - abilities
  - grouped regional Pokedex references
  - evolution displays
  - defensive matchup reference
  - cry audio and footprint display
- Daily encounter flow with anonymous-session-backed capture progress and shiny chance
- My Pokemon gallery based on captured Pokemon stored for the current anonymous session
- Team builder for saving up to six Pokemon with per-member level, nature, item, ability, moves, IVs, EVs, and level-based battle stat display
- Theme toggle
- Contact, terms, and privacy pages

## Current Product Behavior
- The main browsing experience is server-driven for list queries and detail lookup.
- Daily encounter now uses anonymous-session-backed server persistence.
- My Pokemon now reads the same anonymous-session-backed server collection state as daily.
- Team builder and My Teams now store team data per anonymous session in PostgreSQL.
- Team builder now supports per-member level input and preserves that level in saved teams.
- Daily encounter state stores whether the current encounter is shiny.
- My Pokemon supports releasing captured Pokemon so they can enter the daily candidate pool again later.
- Captured Pokemon progress and saved teams still do not sync across devices or accounts.
- The app currently presents one Korean-first experience and does not support runtime locale switching.
- Collection state is mirrored back into local browser storage as a fallback during the current hybrid phase.

## Current Constraints
- Authentication is not implemented.
- Server-backed user persistence is not implemented.
- Automated tests are not present.
- Catalog data operations are still split across snapshot generation and DB import workflows.
- Anonymous daily persistence and anonymous team persistence exist, but account-linked user persistence does not.
- Daily and team persistence require the new DB tables to be migrated before the API routes can work.
- After DB schema changes, the local Next.js dev server may need a restart on Windows before the daily and team routes behave correctly.

## Current Risks
- Anonymous session identity is browser-scoped and is not durable across devices or account changes.
- Collection ownership is still anonymous-session-based rather than account-linked.
- Local development remains sensitive to Windows `.next/trace` lock issues during server restart.

## Current Content Sources
- Pokemon catalog content originates from PokeAPI-derived snapshot generation.
- Temporary Korean ability-description support still includes frontend-held translation logic.

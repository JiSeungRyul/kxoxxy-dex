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
- Daily encounter flow with local capture progress
- My Pokemon gallery based on locally captured Pokemon
- Theme toggle
- Contact, terms, and privacy pages

## Current Product Behavior
- The main browsing experience is server-driven for list queries and detail lookup.
- Daily encounter now uses anonymous-session-backed server persistence.
- My Pokemon still depends on local browser state.
- Captured Pokemon progress still does not sync across devices or accounts.
- The app currently presents one Korean-first experience and does not support runtime locale switching.
- Daily state is mirrored back into local browser storage so the current My Pokemon view stays aligned with daily captures during the hybrid phase.

## Current Constraints
- Authentication is not implemented.
- Server-backed user persistence is not implemented.
- Automated tests are not present.
- Catalog data operations are still split across snapshot generation and DB import workflows.
- Anonymous daily persistence exists, but account-linked user persistence does not.
- Daily persistence requires the new DB tables to be migrated before the API route can work.
- After DB schema changes, the local Next.js dev server may need a restart on Windows before the new daily route behaves correctly.

## Current Risks
- Daily and My Pokemon still use different persistence models:
  - daily uses anonymous-session server storage
  - My Pokemon still renders from browser-local collection state
- Anonymous session identity is browser-scoped and is not durable across devices or account changes.
- Local development remains sensitive to Windows `.next/trace` lock issues during server restart.

## Current Content Sources
- Pokemon catalog content originates from PokeAPI-derived snapshot generation.
- Temporary Korean ability-description support still includes frontend-held translation logic.

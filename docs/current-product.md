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
- Daily encounter and My Pokemon still depend on local browser state.
- Captured Pokemon progress does not sync across devices or accounts.
- The app currently presents one Korean-first experience and does not support runtime locale switching.

## Current Constraints
- Authentication is not implemented.
- Server-backed user persistence is not implemented.
- Automated tests are not present.
- Catalog data operations are still split across snapshot generation and DB import workflows.

## Current Content Sources
- Pokemon catalog content originates from PokeAPI-derived snapshot generation.
- Temporary Korean ability-description support still includes frontend-held translation logic.

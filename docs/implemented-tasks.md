# Implemented Tasks

## Task Group 1. Core Pokedex Browsing

### 1.1 Snapshot-based Pokedex landing page
- Implemented the main route `/` as the primary Pokedex entry
- Loads the entire Pokemon dataset from a local JSON snapshot
- Avoids live API dependency during normal app runtime

### 1.2 Search and filtering
- Supports Korean-name search
- Supports type filtering
- Supports generation filtering
- Allows filter reset back to default state

### 1.3 Sorting and pagination
- Supports sorting by:
  - National Dex number
  - name
  - HP / Attack / Defense / Special Attack / Special Defense / Speed
- Supports client-side pagination over the filtered result set

### 1.4 Table-based result exploration
- Displays Pokemon image, number, name, type, and base stats
- Uses row click navigation to move into detail pages
- Includes empty-state messaging when filters produce no results

## Task Group 2. Pokemon Detail Experience

### 2.1 Detail route and snapshot lookup
- Implemented `/pokemon/[slug]`
- Resolves the selected Pokemon from the same local snapshot

### 2.2 Core profile display
- Displays official artwork and main identity fields
- Shows height, weight, capture rate, gender rate, max experience, and other species metadata
- Supports normal / shiny artwork switching in the hero image area
- Supports previous / next Pokemon navigation above the hero section

### 2.3 Form support
- Supports alternate forms through form tabs
- Keeps default and non-default form navigation separated by query parameter
- Includes regional forms as well as mega and gigantamax forms where present

### 2.4 Evolution visualization
- Builds evolution paths from the stored evolution chain and links
- Handles branching evolution structures
- Renders evolution conditions and evolution-item context
- Applies form-aware evolution artwork where matching form variants exist
- Shows mega / gigantamax branches as special evolution follow-ups where applicable

### 2.5 Battle-related reference information
- Shows base stats
- Computes defensive type matchup buckets
- Presents matchup rows for 4x, 2x, 1x, 0.5x, and 0x effectiveness

### 2.6 Media blocks
- Supports image-based detail blocks
- Supports audio playback blocks when audio data exists in the snapshot
- Includes footprint image and cry playback in the basic info area

### 2.7 Ability information
- Shows ability and hidden ability information in a table below base stats
- Supports temporary frontend-held Korean ability description data
- Falls back to generated Koreanized text or source English text when no local manual translation exists

## Task Group 3. Data Pipeline

### 3.1 PokeAPI snapshot generation
- Implemented `scripts/sync-pokedex.mjs`
- Builds `data/pokedex.json` from PokeAPI
- Korean names are included in the generated snapshot
- Includes grouped Pokedex number data and representative Pokedex flavor text descriptions

### 3.2 Runtime snapshot repository
- Added a dedicated server repository for reading the generated snapshot
- Uses production caching to reduce repeated disk reads

## Task Group 4. Site Chrome and Supporting Pages

### 4.1 Global layout
- Added shared layout in `app/layout.tsx`
- Includes metadata, fonts, theme bootstrap script, and footer

### 4.2 Theme support
- Added theme toggle component
- Added persisted light/dark selection with `localStorage`

### 4.3 Service-style footer and informational pages
- Added footer sections for service, policy, and resources
- Added `/contact`
- Added `/terms`
- Added `/privacy`
- Footer resources include data and media attribution links

## Task Group 6. Pokedex Reference Enrichment

### 6.1 Pokedex number reference display
- Shows grouped regional Pokedex references on the detail page
- Uses representative regional labels such as 관동도감, 성도도감, 호연도감, 신오도감, 하나도감, 칼로스도감, 알로라도감, 가라르도감, 히스이도감, 팔데아도감, 미르도감
- Prefers expanded regional dex numbers when both original and expanded variants exist

### 6.2 Pokedex flavor text display
- Shows one representative Pokedex description per displayed Pokedex group
- Prefers Korean flavor text when available
- Falls back to English source text only when Korean text is unavailable

## Task Group 5. Carry-over / Partial Foundations

### 5.1 Collection state model is now surfaced through dedicated pages
- `/daily` exists and uses daily encounter helpers
- `/my-pokemon` exists and uses local captured-state storage
- Collection sanitization and date-key helpers are active parts of the current workspace

## Recommended Reading Order For A New Session
1. `docs/current-product.md`
2. `docs/architecture.md`
3. `docs/implemented-tasks.md`

## Planned Future Tasks
- Add login
- Add database integration
- Move frontend-held Korean translation data for ability descriptions into the database
- Add item descriptions
- Add character / NPC descriptions
- Add team maker feature
- Add random team selection feature

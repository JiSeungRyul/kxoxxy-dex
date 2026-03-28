# Implemented Tasks

## Purpose
- Keep a historical record of completed work.
- Record what has been built without redefining the full current architecture.

## Core Pokedex Browsing
- Implemented the main Pokedex browsing routes
- Added Korean-name search
- Added type and generation filters
- Added sorting by dex number, name, and base stats
- Added pagination
- Added table-based browsing and empty states

## Pokemon Detail Experience
- Implemented `/pokemon/[slug]`
- Added previous/next navigation
- Added form switching
- Added shiny artwork toggle
- Added base stat presentation
- Added grouped regional Pokedex reference display
- Added representative Pokedex flavor text display
- Added evolution path rendering, including branching and special-form follow-ups
- Added defensive matchup presentation
- Added cry playback and footprint display
- Added ability and hidden-ability presentation with temporary Korean description support

## Data Pipeline
- Implemented `scripts/sync-pokedex.mjs`
- Added local snapshot generation into `data/pokedex.json`
- Added dedicated repository logic for snapshot and catalog access
- Added initial PostgreSQL catalog import flow through `scripts/import-pokedex-to-db.mjs`

## Site Chrome And Supporting Pages
- Added shared layout in `app/layout.tsx`
- Added theme bootstrap and theme toggle
- Added footer with service, policy, and resource links
- Added `/contact`
- Added `/terms`
- Added `/privacy`

## Collection-Oriented Features
- Added `/daily`
- Added `/my-pokemon`
- Added local collection-state helpers for captured Pokemon and daily encounter tracking
- Added anonymous-session PostgreSQL persistence for daily encounter and capture state
- Moved My Pokemon collection reads onto the same anonymous-session-backed server state used by daily
- Added shiny encounter/capture state for daily and release support in My Pokemon
- Added client-side mirroring of daily server state back into local collection storage for hybrid compatibility

## Team Builder (Updated: 2026-03-25)
- Added `/teams` for building teams from the full catalog
- Added `/my-teams` for browsing, editing, and deleting saved teams
- Added anonymous-session-backed PostgreSQL storage for teams and team members
- Added level configuration and level-based battle stat display for team members
- Added the `0003_team_builder` and `0004_team_member_level` migrations and Drizzle schema entries
- Hardened team save/load handling so saved member level is preserved and saved team reads stay aligned to the latest catalog snapshot
- Split the reduced route payloads so `/daily` and `/my-pokemon` load collection-specific catalog fields while `/teams` loads only the team-builder fields it needs
- Slimmed `/my-pokemon` again so it no longer receives daily-only catalog fields such as generation and stats
- Reworked `/daily` so the first render now ships only daily candidate dex numbers and fetches encounter/recent-capture detail on demand through `app/api/pokedex/catalog/route.ts`
- Reworked `/teams` so the first render now ships only dex-number-and-name option entries and fetches selected team-member detail on demand through `app/api/pokedex/catalog/route.ts`
- Reworked `/my-pokemon` so the first render now ships no gallery catalog and fetches captured-card detail on demand through `app/api/pokedex/catalog/route.ts`
- Verified the route payload restructuring with `npm run typecheck`, `npm run build`, and local smoke checks for `/daily`, `/my-pokemon`, `/teams`, `/api/daily/state`, `/api/teams/state`, and `/api/pokedex/catalog` on 2026-03-25

## Database Groundwork
- Added local PostgreSQL Docker Compose setup
- Added environment template for database configuration
- Added shared DB client in `lib/db/client.ts`
- Added Drizzle configuration
- Added initial catalog schema and migration files

## Workflow Guardrails (Added: 2026-03-25)
- Added a pre-commit documentation rule in AGENTS.md
- The rule requires documenting task changes in docs/ before running git add, git commit, or git push
- This keeps implementation notes, reasons for change, and behavior updates recorded before git history is advanced

## Performance Re-Measurement Workflow (Added: 2026-03-26)
- Added docs/performance-guide.md to standardize repeatable npm run dev and npm run start measurements for /, /daily, /my-pokemon, /teams, /api/daily/state, and /api/teams/state.
- Recorded local 2026-03-26 dev/start payload-size and first-response timing baselines, plus an optional /api/pokedex/catalog spot check.
## My Pokemon Gallery Layout (Added: 2026-03-26)
- Centered the My Pokemon gallery card layout so small capture counts no longer stay left-aligned on wide screens.
- Switched the gallery container to a centered wrapping layout that keeps the cards grouped cleanly as the viewport narrows.

## My Pokemon Capture Timestamps (Added: 2026-03-26)
- Extended the collection state to carry each captured Pokemon's timestamp from daily persistence into the My Pokemon gallery.
- Added a capture-time label under each My Pokemon card's type line and above the release action.

## Post-Migration Smoke Workflow (Added: 2026-03-26)
- Expanded docs/verification-guide.md with a daily/team post-migration smoke sequence covering migrate, optional reseed, Windows server restart, and the minimum route/API checks.
- Added failure-triage notes for missing daily/team tables, stale local catalog state, and anonymous-session reuse issues.
- Verified the post-migration route/API sequence locally on 2026-03-26 for /daily, /teams, /my-teams, /api/daily/state, and /api/teams/state, including daily reroll plus team save/delete round-trips.

## Targeted Stability Audit (Added: 2026-03-26)
- Audited the recent payload-split and on-demand catalog-detail changes across /daily, /my-pokemon, /teams, and /api/pokedex/catalog
- Tightened the team-builder selected-detail fetch so it reruns only when the chosen dex-number set changes, avoiding unnecessary refetches during nature, item, level, IV, and EV edits
- Hardened /api/pokedex/catalog so non-positive dex numbers are ignored and repository failures return a controlled JSON 500 response instead of an uncaught route error
- Verified the recent daily, my-pokemon, teams, daily-state, teams-state, and catalog flows with local DB-backed smoke checks on 2026-03-26, including daily reroll plus team save/delete round-trips
## Planned Follow-Up Areas
- Authentication
- Server-backed user persistence
- Team builder
  - Add stronger server-managed session ownership beyond the current browser-scoped anonymous session
- Favorites
  - Allow favorite toggling from the Pokemon list UI
  - Allow favorite toggling from Pokemon detail pages
  - Add a dedicated favorites view for browsing saved favorite Pokemon
  - Prefer a direct navigation entry for favorites during the current MVP stage instead of a broader my-page shell
- Further DB integration beyond the current hybrid stage
- Replace anonymous browser-scoped session ownership with account-linked ownership later

## UI And UX Backlog (Added: 2026-03-24)

### Pokemon Detail Page
- Fix broken Korean text in the gender-ratio display
- Fix broken Korean text in the defensive-matchup multiplier display

### Daily And My Pokemon
- Rework the Daily Encounter background art and overall Pokemon scene styling for the main encounter CTA area
- Improve My Pokemon gallery alignment so a single captured Pokemon does not stay left-aligned on wide screens
- Keep My Pokemon responsive so the gallery centers cleanly and wraps downward as the viewport narrows
- Aim for a wide-layout presentation that visually groups around five cards per row before wrapping when space allows

### Team Builder
- Add search-based Pokemon selection in addition to the current select control
- Consider moving ability selection to a dropdown in a later step
- Consider adding searchable item selection plus dropdown support later
- Check whether move selection can use Pokemon-specific learnable move dropdowns later
- Show which stat is raised and lowered when a nature is selected
- Prevent EV inputs from exceeding the total cap during editing and add stronger over-cap feedback around the `510 / 510` indicator
- Rebalance the layout so base stats, IVs, and EVs align more cleanly with the upper content blocks instead of feeling left-heavy
- Rebalance the layout for nature, item, and ability controls in the same way
- Move My Teams under the Team Builder navigation as a child option and rename the creation action to a clearer label than the current wording

## Daily Encounter Presentation Refresh (Added: 2026-03-26)
- Refined the /daily main encounter hero so the Pokemon art uses the larger artwork image by default instead of the smaller sprite when possible.
- Added a five-tier size scale for daily encounter presentation using Pokemon height and weight so very small Pokemon no longer look over-enlarged in the hero scene.
- Expanded the encounter stage with a stronger spotlight, scale badge, and slightly taller scene framing while keeping daily capture, reset, and reroll behavior unchanged.

## Pokedex Capture Badge Regression Fix (Added: 2026-03-27)
- Stopped the main Pokedex list from rendering the daily collection capture badge so anonymous-session capture progress remains scoped to /daily and /my-pokemon.
- Kept the existing daily capture persistence and My Pokemon gallery behavior unchanged.

## Daily Encounter Scale Rebalance (Added: 2026-03-27)
- Rebalanced the /daily five-stage encounter size thresholds around more real-world perceived size ranges, using wider height and weight bands from very small through very large presentation.
- Increased the visual separation between each stage so tiny Pokemon read noticeably smaller and giant Pokemon claim much more of the encounter scene without changing daily capture behavior.

## Daily Encounter Height-Only Scale Tuning (Added: 2026-03-27)
- Simplified the /daily size-stage logic to use height-only thresholds so short Pokemon no longer jump into oversized presentation because of weight.
- Increased the visual gap between the smallest and largest encounter stages so sub-1m Pokemon read clearly smaller in the hero scene.

## Daily Encounter Background Smoothing (Added: 2026-03-27)
- Softened the /daily scene horizon by overlapping the sky and ground layers with a transition haze instead of a hard visual seam.
- Reworked the lower grass and ground overlays so the encounter backdrop reads more like a continuous stage and less like broken image bands.

## Daily Encounter Reroll Transition Stabilization (Added: 2026-03-27)
- Kept the previous /daily encounter visible while the rerolled Pokemon detail is still loading so the scene no longer flashes into an empty-state layout.
- Disabled encounter actions during that short transition window so the UI stays stable until the new reroll detail arrives.

## Team Builder Searchable Pokemon Selector (Added: 2026-03-27)
- Replaced the full 1025-option Pokemon dropdown in /teams with a searchable selector that filters by Pokemon name.
- Kept the existing team draft editing flow and on-demand selected-detail fetch behavior unchanged while limiting the visible search results list.

## Team Builder Format Selection (Added: 2026-03-27)
- Added a team-level format selector for `default`, `gen6`, `gen7`, `gen8`, and `gen9` in /teams with `default` as the default for new drafts.
- Extended team save/load handling so the selected format is persisted in PostgreSQL and older saved teams safely fall back to `default` when the new field is absent.

## Team Builder Format-Based Gimmick Visibility (Added: 2026-03-27)
- Added a `default` team format that hides the gimmick controls until a specific generation format is selected.
- Added minimal per-member gimmick persistence with generation-scoped options so `/teams` now shows only the baseline gimmicks allowed by `gen6`, `gen7`, `gen8`, and `gen9`.
- Kept Pokemon-specific gimmick eligibility and generation-filtered Pokemon option lists out of this step so the current change stays limited to format-based UI gating.

## Team Builder Species-Based Gimmick Filtering (Added: 2026-03-28)
- Updated `/teams` so gimmick choices are filtered by both team format and the currently selected Pokemon species.
- Hid Mega Evolution for Pokemon that do not have a mega form while keeping Z-Moves, Dynamax, and Terastallization on their current format-based rules.
- Added team-builder payload metadata for mega-form and Gigantamax availability so the current filtering works from catalog data and later gimmick-detail UI can reuse the same source.

## Team Builder Mega Toggle (Added: 2026-03-29)
- Added a minimal Mega Evolution toggle in `/teams` for Pokemon that can mega evolve in formats where mega is allowed.
- Kept the existing single `gimmick` persistence model and disabled other gimmick selection while mega is toggled on for the same slot.
- Left Z-Move and Terastallization UI for later follow-up steps.

## Team Builder Dynamax Toggle (Added: 2026-03-29)
- Added a minimal Dynamax toggle in `/teams` for Pokemon selected under `gen8`.
- Kept the existing single `gimmick` persistence model and disabled other gimmick selection while Dynamax is toggled on for the same slot.
- Added a lightweight Gigantamax hint for eligible Pokemon without introducing separate Gigantamax-detail controls yet.

## Team Builder Z-Move Toggle (Added: 2026-03-29)
- Added a minimal Z-Move toggle in `/teams` for Pokemon selected under `gen7`.
- Kept the existing single `gimmick` persistence model and disabled other gimmick selection while the Z-Move toggle is on for the same slot.
- Explicitly kept Z-Crystal selection, signature Z-Move handling, and move-validity checks out of this MVP step.

## Team Builder Terastallization Type Selection (Added: 2026-03-29)
- Added a minimal Terastallization toggle in `/teams` for Pokemon selected under `gen9`.
- Added a persisted tera-type field for team members so the selected tera type survives save/load round-trips.
- Kept this MVP step limited to tera-type selection only, without Stellar support or deeper terastal validation rules.

## Team Builder Format-Based Option Narrowing (Added: 2026-03-29)
- Narrowed `/teams` search candidates by the selected team format instead of always showing the full Pokemon list.
- Kept the filter intentionally conservative so Pokemon already covered by the selected format generation remain visible, and Pokemon with matching format-era Pokedex entries are also kept to avoid false negatives.
- Kept already selected team members intact when the team format changes, so the candidate filter only affects new searches and replacements in this MVP step.

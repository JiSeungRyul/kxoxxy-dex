# Implemented Tasks

## Purpose
- Keep a historical record of completed work.
- Record what has been built without redefining the full current architecture.

## Core Pokedex Browsing
- Implemented the main Pokedex browsing route at `/pokedex`
- Implemented the Pokemon detail route at `/pokemon/[slug]`
- Added server-side catalog list and detail fetching through `features/pokedex/server/repository.ts`
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

## Favorites Follow-Up Stabilization (Added: 2026-04-03)
- Replaced the broken repository migration for `favorite_pokemon` with an incremental migration that only adds the favorites table, its foreign keys, and its unique index.
- Re-verified the cookie-based favorites runtime so `GET /api/favorites/state` and `POST /api/favorites/state` now complete successfully on the migrated local DB.
- Removed the unnecessary `/favorites` dependency on the daily collection-state load path so the favorites view now waits on favorites state directly instead of first relying on `/api/daily/state`.
- Re-ran `npm run typecheck`, `npm run build`, and local smoke checks for `/favorites`, `/api/favorites/state`, and `/api/daily/state` after the decoupling change.

## Authentication Groundwork (Added: 2026-04-03)
- Defined the preferred auth direction as minimal auth plus a separate server-managed authenticated session layered on top of the current anonymous-session fallback.
- Added checked-in DB schema groundwork for `users`, `auth_accounts`, and `sessions` so later auth runtime work can resolve a durable `user_id`.
- Added a minimal authenticated-session read boundary at `app/api/auth/session/route.ts` plus a shared server helper for resolving the current authenticated user from the future auth-session cookie.
- Fixed the preferred authenticated write order as `favorites -> daily/my-pokemon -> teams` so the first account-linked rollout starts from the smallest persisted state.
- Verified the new groundwork with `npm run typecheck`, `npm run build`, `npm run db:migrate`, unauthenticated `GET /api/auth/session`, and an authenticated local smoke check using a temporary `users`/`sessions` row plus `kxoxxy-auth-session` cookie.
- Kept runtime auth, login/logout UI, and authenticated request handling explicitly out of this step.

## Minimal Auth Session UI (Added: 2026-04-03)
- Extended `app/api/auth/session/route.ts` so the current MVP auth boundary can create and clear a development-only auth session in addition to reading it.
- Added a small auth panel to the shared site header so local sessions can be created and cleared without adding a dedicated auth page yet.
- Verified the round-trip with local `POST /api/auth/session`, `GET /api/auth/session`, `DELETE /api/auth/session`, and final `GET /api/auth/session` checks using the issued `kxoxxy-auth-session` cookie.

## Shared Ownership Resolver Groundwork (Added: 2026-04-03)
- Added a shared server ownership resolver that prefers authenticated `userId` and falls back to anonymous `sessionId`.
- Wired the favorites and teams state routes to that resolver so later `user_id` persistence work can start from one common owner-selection path.
- Verified that anonymous requests still return the current anonymous-session-backed responses, while authenticated favorites and teams requests now return explicit pending-owner responses until their `user_id` persistence steps are implemented.

## Authenticated Favorites Ownership (Added: 2026-04-03)
- Extended `favorite_pokemon` so favorites can now belong to either `anonymous_session_id` or `user_id`.
- Kept anonymous favorites intact while enabling authenticated favorites to read and write through the shared ownership resolver.
- Verified both paths locally: anonymous favorites still toggle normally, and authenticated favorites now persist separately under `user_id`.

## Authenticated Daily Ownership (Added: 2026-04-03)
- Extended `daily_encounters` and `daily_captures` so daily/my-pokemon state can now belong to either `anonymous_session_id` or `user_id`.
- Reused the shared ownership resolver in `app/api/daily/state/route.ts` so authenticated daily requests resolve `user_id` first while anonymous requests keep the current cookie-backed session flow.
- Verified both paths locally with `npm run db:generate`, `npm run db:migrate`, `npm run build`, `npm run typecheck`, anonymous `GET/POST /api/daily/state`, authenticated `POST /api/auth/session`, authenticated `GET/POST /api/daily/state`, authenticated `release`, and a final anonymous `GET /api/daily/state` check confirming the two owners stay separated.

## Authenticated Team Ownership (Added: 2026-04-03)
- Extended `teams` so saved teams can now belong to either `anonymous_session_id` or `user_id` without changing the existing `team_members` shape.
- Reused the shared ownership resolver in `app/api/teams/state/route.ts` so authenticated team requests resolve `user_id` first while anonymous requests keep the current cookie-backed session flow.
- Verified both paths locally: anonymous teams still save and load normally, and authenticated teams now persist separately under `user_id` while reusing the existing authenticated save path and keeping the existing builder edit link.

## Account Hub and Favorites Persistence (Added: 2026-04-05)
- Implemented the Google OAuth-based authentication for persistent features (favorites, daily, teams).
- Replaced anonymous sessions with mandatory `user_id`-based ownership for all persisted data.
- Added a centralized `/my` account hub page showing user profile, activity summary, and navigation to personal content.
- Added a first `/my-teams` list-management bar so larger saved-team lists can now be searched by team name and filtered by format/mode before sorting.

## Authentication UX Refinement & Audit (Added: 2026-04-06)
- Standardized Login CTA (Call To Action) copy across all protected views (`favorites`, `daily`, `my-pokemon`, `teams`), emphasizing the benefits of signing in (e.g., "Start your own collection journey").
- Unified the visual style of Google Login buttons to `rounded-2xl` for consistent look-and-feel across the product.
- Implemented automatic redirection to the home page (`/`) when a user signs out from a protected route (e.g., `/my`, `/favorites`, `/teams`).
- Refined the shared site header's account section with clearer session status messages and an improved "My Page" navigation button.
- Conducted a code audit and improved maintainability by extracting hardcoded protected routes to a shared constant (`PROTECTED_ROUTES`) and adding proper logout error handling.
- Defined the Account Deletion Policy (Soft Delete) and extended the `users` schema with `is_active` and `deleted_at` columns to support grace periods and future data erasure.

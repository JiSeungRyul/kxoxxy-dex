# Implemented Tasks

## Purpose
- Keep a historical record of completed work.
- Record what has been built without redefining the full current architecture.
- Older entries may describe intermediate runtime states that were later replaced; use `docs/current-product.md`, `docs/architecture.md`, and `docs/session-guide.md` as the current runtime source of truth.

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

## Historical Auth And Ownership Migration Notes

The sections below record intermediate migration steps that are no longer the active runtime model. Read them as implementation history, not as current behavior.

## Authentication Groundwork (Historical, Added: 2026-04-03)
- Defined the preferred auth direction as minimal auth plus a separate server-managed authenticated session layered on top of the current anonymous-session fallback.
- Added checked-in DB schema groundwork for `users`, `auth_accounts`, and `sessions` so later auth runtime work can resolve a durable `user_id`.
- Added a minimal authenticated-session read boundary at `app/api/auth/session/route.ts` plus a shared server helper for resolving the current authenticated user from the future auth-session cookie.
- Fixed the preferred authenticated write order as `favorites -> daily/my-pokemon -> teams` so the first account-linked rollout starts from the smallest persisted state.
- Verified the new groundwork with `npm run typecheck`, `npm run build`, `npm run db:migrate`, unauthenticated `GET /api/auth/session`, and an authenticated local smoke check using a temporary `users`/`sessions` row plus `kxoxxy-auth-session` cookie.
- Kept runtime auth, login/logout UI, and authenticated request handling explicitly out of this step.

## Minimal Auth Session UI (Historical, Added: 2026-04-03)
- Extended `app/api/auth/session/route.ts` so the current MVP auth boundary can create and clear a development-only auth session in addition to reading it.
- Added a small auth panel to the shared site header so local sessions can be created and cleared without adding a dedicated auth page yet.
- Verified the round-trip with local `POST /api/auth/session`, `GET /api/auth/session`, `DELETE /api/auth/session`, and final `GET /api/auth/session` checks using the issued `kxoxxy-auth-session` cookie.

## Shared Ownership Resolver Groundwork (Historical, Added: 2026-04-03)
- Added a shared server ownership resolver that prefers authenticated `userId` and falls back to anonymous `sessionId`.
- Wired the favorites and teams state routes to that resolver so later `user_id` persistence work can start from one common owner-selection path.
- Verified that anonymous requests still return the current anonymous-session-backed responses, while authenticated favorites and teams requests now return explicit pending-owner responses until their `user_id` persistence steps are implemented.

## Authenticated Favorites Ownership (Historical, Added: 2026-04-03)
- Extended `favorite_pokemon` so favorites can now belong to either `anonymous_session_id` or `user_id`.
- Kept anonymous favorites intact while enabling authenticated favorites to read and write through the shared ownership resolver.
- Verified both paths locally: anonymous favorites still toggle normally, and authenticated favorites now persist separately under `user_id`.

## Authenticated Daily Ownership (Historical, Added: 2026-04-03)
- Extended `daily_encounters` and `daily_captures` so daily/my-pokemon state can now belong to either `anonymous_session_id` or `user_id`.
- Reused the shared ownership resolver in `app/api/daily/state/route.ts` so authenticated daily requests resolve `user_id` first while anonymous requests keep the current cookie-backed session flow.
- Verified both paths locally with `npm run db:generate`, `npm run db:migrate`, `npm run build`, `npm run typecheck`, anonymous `GET/POST /api/daily/state`, authenticated `POST /api/auth/session`, authenticated `GET/POST /api/daily/state`, authenticated `release`, and a final anonymous `GET /api/daily/state` check confirming the two owners stay separated.

## Authenticated Team Ownership (Historical, Added: 2026-04-03)
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

## Soft Delete Session Guard (Added: 2026-04-07)
- Hardened the shared authenticated-session boundary so inactive soft-deleted users no longer resolve as authenticated, and stale `sessions` rows are invalidated when that boundary is hit.
- Blocked new authenticated session issuance for inactive users in both the development fallback sign-in path and the Google OAuth callback path.
- Kept protected routes on the existing auth-required fallback behavior so `/my`, favorites, daily/my-pokemon, and teams/my-teams now behave like signed-out views when the account is inactive.

## Account Delete Request Entry (Added: 2026-04-07)
- Added `POST /api/account/delete` as the first authenticated account-deletion request boundary for the current MVP.
- Added a warning section and delete-request entry to `/my` so the account hub now exposes a direct soft-delete action without introducing a broader settings page yet.
- The current delete request only inactivates the user and clears active sessions; related favorites, captures, and saved teams remain retained for later recovery-policy follow-up work.

## Grace-Period Account Recovery (Added: 2026-04-07)
- Added a first recovery rule for soft-deleted accounts: the same account can be reactivated by signing in again while `deleted_at` remains inside the grace period.
- Wired the provider callback to redirect restored users to `/my?accountRestored=true` so the account hub can show a small recovery notice after reactivation.
- Kept expired or otherwise inactive accounts outside that window blocked from new authenticated session issuance.

## Post-Grace Purge Policy (Added: 2026-04-07)
- Defined the post-grace purge policy for account-owned persisted data: once `deleted_at` is older than 30 days, the account becomes an operations-side hard-delete target.
- Fixed the preferred cleanup method as deleting the `users` row and relying on existing FK cascades to remove `auth_accounts`, `sessions`, favorites, daily state, teams, and team members together.
- Kept that purge out of the live user request path so the current MVP still exposes soft delete plus recovery, while final deletion remains a maintenance operation.

## User Data Reset Scope (Added: 2026-04-07)
- Defined user data reset as a separate future feature from account deletion: it should preserve `users`, `auth_accounts`, and `sessions` while clearing persisted gameplay data only.
- Fixed the reset target scope as favorites, collection progress (`daily_encounters`, `daily_captures`), and saved teams (`teams`, `team_members`).
- Fixed the preferred full-reset execution order as `team_members -> teams -> daily_encounters -> daily_captures -> favorite_pokemon`.

## Auth Failure UX And Account Smoke Documentation (Added: 2026-04-07)
- Added a first standardized auth-failure UX layer for sign-in start failures, provider callback failures, and protected-view session-expiry cases.
- Centralized the current auth UI copy so the header, home banner, and protected-route login fallbacks use the same user-facing wording.
- Extended `docs/verification-guide.md` with minimum smoke-check coverage for `/my`, account deletion, grace-period recovery, and restored-data confirmation.

## My Pokemon Sort Follow-Up (Added: 2026-04-07)
- Kept the `my-pokemon` management controls focused on high-value collection browsing signals rather than adding broader sort families.
- Extended capture-time sorting with an `오래된 포획순` option in addition to the existing recent-first order.
- Explicitly left generation, shiny-priority, and type-group sorting out of the current MVP scope.

## Random Team Entry Point (Added: 2026-04-07)
- Added `/teams/random` as a lightweight random-team experience under the team-building navigation.
- The first version intentionally randomizes Pokemon species only and leaves item, ability, nature, moves, battle stats, and tera settings out of scope.
- The first version samples six unique Pokemon species and renders only artwork, dex number, name, and types in a lightweight result card grid.
- Kept the feature as a separate entry under the team-building navigation so it does not alter the existing team-builder save/edit flow.
- Followed up on the presentation so the explanation, action button, and result area now read as one connected block, while the result heading copy is simplified to `랜덤 팀` / `Random Team`.
- Added a short rolling state with lightweight motion and a brief delay so the random draw feels intentional without stretching into a long wait.

## Account Hub Navigation Split (Added: 2026-04-14)
- Reworked `/my` so the account-hub links are no longer shown as one flat card row.
- Grouped the hub navigation into collection, team, and account-management sections while keeping the existing destinations unchanged.
- Kept account profile, summary, guide copy, and delete-request entry on the same page so the change stays within information architecture and presentation scope.

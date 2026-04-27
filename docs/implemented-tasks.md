# Implemented Tasks

## Purpose
- Keep a historical record of completed work.
- Record what has been built without redefining the full current architecture.
- Older entries may describe intermediate runtime states that were later replaced; use `docs/current-product.md`, `docs/architecture.md`, and `docs/session-guide.md` as the current runtime source of truth.

## When To Read This
- Read this when you need historical implementation context or want to confirm whether a backlog item was already completed.
- Do not read this first for ordinary feature work; current runtime behavior belongs in `docs/current-product.md` and `docs/architecture.md`.

## Current Feature Baseline
- Main Pokedex browsing, Pokemon detail, favorites, daily encounter, My Pokemon, team builder, My Teams, random team, and account hub are already implemented.
- Persisted gameplay features are now account-bound through authenticated `user_id`.
- The sections below are historical implementation notes grouped by milestone, not a replacement for current runtime docs.

## Production Deployment — Hetzner VPS (Added: 2026-04-23)
- Provisioned Hetzner CAX11 ARM64 VPS (Helsinki, Ubuntu 24.04, 2 vCPU / 4 GB RAM) at `135.181.252.56`.
- Installed Node.js v24 LTS, PostgreSQL 16, Caddy reverse proxy, and PM2 process manager.
- Connected domain `kxoxxy-dex.com` via DNS A record; Caddy issued HTTPS certificate automatically.
- Set production env vars in `/var/www/kxoxxy-dex/.env`: `DATABASE_URL`, `AUTH_PROVIDER=google`, `AUTH_URL=https://kxoxxy-dex.com`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Ran `npm ci`, `npm run build`, `npm run db:migrate`, and all seed scripts; started app with PM2.
- Note: drizzle-kit reads `.env`, not `.env.local`; copied `.env.local` → `.env` to unblock migrations.
- Note: PostgreSQL connection string required URL-encoding (`@` → `%40`, `#` → `%23`) for passwords with special characters.

## Google OAuth Production Setup (Added: 2026-04-23)
- Created Google OAuth 2.0 credentials in Google Cloud Console with production redirect URI `https://kxoxxy-dex.com/api/auth/callback/google`.
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in production env.
- Verified full Google login round-trip (sign-in → OAuth consent → callback → session) on the live domain.

## Auth Callback Redirect Fix — AUTH_URL Env Var (Added: 2026-04-23)
- `app/api/auth/callback/google/route.ts` was using `new URL("/", request.url)` to construct redirect URLs after OAuth callback.
- Behind Caddy reverse proxy, `request.url` resolved to `http://localhost:3000/...` instead of the external domain, causing login to redirect to `localhost:3000`.
- Fix: introduced `AUTH_URL` env var as the canonical base for all redirect URL construction in the callback route, replacing the `request.url`-derived base.
- Both `getReturnUrl()` and `getRecoveredAccountReturnUrl()` helpers now use `AUTH_URL` directly.
- Caddyfile `header_up Host {host}` forwarding was also added as a proxy-header fix but the root cause was in the route code.

## Dev Login Blocked In Production — Task 45 (Added: 2026-04-23)
- Added `NODE_ENV === "production"` guards to both the GET and POST handlers in `app/api/auth/sign-in/route.ts`.
- In production, both handlers now return `{ error: "Authentication not configured" }` with status `503` immediately, blocking any dev-fallback session creation.
- Removed all dev-mode UI from `features/site/components/site-hero-header.tsx`:
  - `handleSignIn` now calls `window.location.assign("/api/auth/sign-in")` unconditionally; the dev POST fetch branch is removed.
  - Dev mode warning message and dev-only button label variants are removed.
  - Default `authMode` state changed from `"development"` to `"provider"`.
  - All `"development"` UI copy paths replaced with provider-mode equivalents.

## Pokedex Search Debounce — Task 48 (Added: 2026-04-23)
- `features/pokedex/components/pokedex-page.tsx` was syncing the search query to the URL (triggering a server re-fetch) on every keystroke, causing visible flickering of Pokemon name text.
- Added a 350 ms debounced `debouncedSearchTerm` state derived from `searchTerm`.
- URL sync effect and page-reset effect now use `debouncedSearchTerm`; the existing `deferredSearchTerm` value is kept for immediate local UI filtering only.

## My-Teams Independent Accordion — Task 49 (Added: 2026-04-23)
- `/my-teams` previously allowed only one team expanded at a time (`expandedTeamId: number | null`).
- Changed to a `Set<number>` (`expandedTeamIds`) so each team can be independently opened or closed without collapsing others.
- All previous single-expand references (auto-open on load, auto-open on first load of each team) replaced with Set-based toggles or removed.
- Saved-team auto-open after save still works via `setExpandedTeamIds(prev => new Set(prev).add(savedId))`.

## Documentation Routing Cleanup (Added: 2026-04-15)
- Slimmed `docs/session-guide.md` into a session-start routing document instead of a long historical handoff.
- Split condensed historical design notes into `docs/decision-log.md` so session startup no longer needs to load long review sections by default.
- Changed `docs/todo-backlog.md` to keep only unfinished work and moved the “completed work” role fully onto this document.
- Added `When To Read This` guidance to the main topic docs so agents can load only task-relevant documents instead of reading the whole docs tree each time.
- Added a short `Project Identity / Non-Negotiables / Source Of Truth` block at the top of `docs/session-guide.md` so the repository's character is injected immediately at session start.

## Auth Boundary Documentation Tightening (Added: 2026-04-15)
- Fixed the docs so provider mode and development fallback are no longer described as equally valid production paths.
- Recorded the exact env-gated provider-mode condition and clarified that Google provider mode is the real launch/production auth path.
- Marked the development fallback sign-in route as a local/provider-unconfigured verification boundary only, and aligned the deployment and verification guides to enforce that distinction.

## Minimum Automated Test Baseline (Added: 2026-04-15)
- Added a Node built-in test runner setup plus small test-environment shims so repo-local TypeScript server modules and Next route handlers can be exercised without adding a new dependency.
- Added minimum automated coverage for the auth-session boundary, persisted state APIs (`favorites`, `daily`, `teams`), and representative repository read paths.
- Fixed the first soft-launch test baseline as a boundary-safety layer rather than a full integration-test suite.

## Minimum Failure Triage Baseline (Added: 2026-04-15)
- Added a minimum one-operator triage flow for login/session failure, persisted-state API failure, and `db:migrate` / `db:seed:*` failure.
- Fixed `docs/verification-guide.md` as the primary troubleshooting document for auth, API, and bootstrap failures.
- Linked `docs/deployment-guide.md` and `docs/session-guide.md` back to that same verification path so deploy-time and session-start guidance use one triage entry.

## Deploy Readiness Checklist Baseline (Added: 2026-04-15)
- Organized the production docs around one execution order: pre-deploy env/bootstrap, post-deploy smoke check, then first triage when rollout verification fails.
- Fixed the post-deploy 10-minute smoke-check route/API order and aligned `docs/deployment-guide.md`, `docs/verification-guide.md`, and `docs/soft-launch-checklist.md` to the same sequence.
- Left backup execution and restore-proof steps for the next launch-prep stage instead of mixing them into the pre-deploy checklist.

## Backup And Restore Launch Baseline (Added: 2026-04-15)
- Fixed the soft-launch backup requirement around a concrete `pg_dump`-based minimum instead of a vague “backup exists” standard.
- Added restore proof as an explicit launch criterion: one safe restore must be completed and followed by route/session rechecks.
- Tightened the launch smoke-check baseline so it now includes app restart plus post-restart session and persisted-route confirmation.

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
- Added a first-load placeholder grid for `/teams/random` so the result area keeps its six-card structure visible before the user triggers the first draw.
- Added a first-pass filter bar for `/teams/random` with generation selection and `전설 · 환상 제외`.
- Kept the existing no-duplicate-species behavior implicit in the current random sampling logic, so no separate dex-duplication toggle was added.
- Expanded the default `/teams/random` draw so currently supported general forms are sampled inside the existing six-species draw, and the result cards now render the selected form artwork, types, and Korean form label when a supported form is chosen.
- Added a first-pass `최소 타입` draw condition for `/teams/random`, retrying the six-species sample until the final displayed team includes at least one Pokemon of the selected type.

## Account Hub Navigation Split (Added: 2026-04-14)
- Reworked `/my` so the account-hub links are no longer shown as one flat card row.
- Grouped the hub navigation into collection, team, and account-management sections while keeping the existing destinations unchanged.
- Kept account profile, summary, guide copy, and delete-request entry on the same page so the change stays within information architecture and presentation scope.

## Random Team Candidate Pool Mode And Layout Overhaul (Added: 2026-04-21)

### 후보군 모드 (38-14)
- Split the previous single `LEGENDARY_MYTHICAL_DEX_NUMBERS` set into three categorized sets: `SUB_LEGENDARY_DEX_NUMBERS` (준전설, VGC Restricted 미포함 전설 계열), `RESTRICTED_LEGENDARY_DEX_NUMBERS` (전설, VGC Restricted), `MYTHICAL_DEX_NUMBERS` (환상, 배포 한정).
- Replaced the `excludeLegendaryMythical: boolean` filter state with `poolMode: "normal" | "sub-legendary" | "unrestricted"`.
- Added a three-button inline toggle (`일반 / 준전설포함 / 전체`) replacing the previous checkbox, styled to match the Pokedex controls pattern.
- Default pool mode is `normal` (전설·환상 전체 제외), matching the previous checkbox-checked behavior.

### /teams/random 레이아웃 개편
- Moved the filter bar (세대, 후보군 토글, 뽑기 버튼) into the lower 랜덤 팀 section and removed the separate filter area from the upper card.
- Reorganized the header row of the 랜덤 팀 section into a right-aligned flex row using Pokedex controls style (`rounded-2xl border bg-card px-4 py-3` + label + content).
- Moved each slot type select directly above its corresponding slot card so type conditions are co-located with their result.
- Kept slot type selects always visible even during rolling (previously they disappeared with the grid).
- Added a `비우기` button left of the 세대 filter: disabled/gray when the team is empty, enabled with rose styling when a team is present.
- Replaced the gray placeholder inner circle with an inline SVG Pokéball (red top half, white bottom half) in each unrolled slot.
- Changed the placeholder name text to `뽑기 전` and slot type option label `없음` → `전체`.
- Added a custom `▾` arrow indicator to slot type selects using `appearance-none` + absolute positioned span for consistent visibility.

### 헤더 소폭 개선
- Changed `ThemeToggle` from horizontal (`inline-flex`) to vertical (`flex-col`) layout so light/dark buttons stack top-to-bottom.
- Moved `ThemeToggle` before the account info box so the account box sits at the rightmost end of the header.
- Removed the `로그인 상태입니다.` status line that showed under the user name when authenticated.
- Changed the account box text alignment from `text-right` to `text-left` so the `ACCOUNT` label is left-aligned.

### 개발 환경 개선
- Updated `package.json` `dev` script to `fuser -k 3000/tcp 2>/dev/null; next dev -p 3000` so the dev server always starts on port 3000, killing any existing process on that port first.

## Auth Gate, Header UX, and Ops Fixes (Added: 2026-04-24)

### 보호 라우트 서버 사이드 auth gate
- `middleware.ts` 없이 각 보호 페이지 서버 컴포넌트에서 직접 `kxoxxy-auth-session` 쿠키 유무를 체크.
- 쿠키 없으면 `SignInPrompt` (`features/pokedex/components/sign-in-prompt.tsx`)를 즉시 서버 렌더링하여 클라이언트 flash 없이 로그인 UI 표시.
- 대상: `/favorites`, `/daily`, `/my-pokemon`, `/teams`, `/my-teams`.
- `/teams`는 쿠키 없을 때 `Promise.all` DB fetch를 건너뛰고 즉시 반환.

### 헤더 Account 영역 개선
- `app/layout.tsx`를 async로 전환해 서버에서 세션 확인 후 `initialUser`를 `SiteHeroHeader`에 전달.
- `SiteHeroHeader`가 `initialUser` prop으로 초기 auth 상태를 즉시 반영 — "확인 중..." flash 제거.
- 초기 렌더용 `/api/auth/session` `useEffect` fetch 제거.
- `ThemeToggle` 버튼을 가로 배치(`flex-row`)로 변경하고 Account 카드 위 세로 배치(`flex-col`)로 정렬.

### DB 백업 크론 시간 수정
- postgres crontab 스케줄을 `0 3 * * *` (UTC 03:00 = KST 12:00)에서 `0 18 * * *` (UTC 18:00 = KST 03:00)으로 변경.
- `docs/deployment-guide.md` 백업 스케줄 항목도 동일하게 갱신.

### 소프트 런치 체크리스트 마무리
- 세션 만료/로그인 실패 시 500 반복 미발생 검증 완료 (C항목 체크).

## /my-teams 아코디언 UI (Added: 2026-04-27)
- `/my-teams` 팀 목록을 아코디언 구조로 변경 (`features/pokedex/components/my-teams-page.tsx`).
- 카드 헤더(날짜, 이름, 메타, 썸네일 영역) 전체를 클릭해 상세 멤버 카드를 펼치고 접을 수 있다.
- 헤더 우측에 chevron SVG 추가 — `isExpanded` 여부에 따라 `rotate-90` 으로 방향 전환.
- 기존 "상세 보기/닫기" 전용 버튼 제거 — 헤더 클릭이 그 역할을 대체.
- 기본값은 모두 접힌 상태 (`expandedTeamIds` 초기값 `new Set()` 유지).
- 수정하기, 복제, 이름 변경, 삭제 액션 버튼은 항상 노출.
- API/상태 구조 변경 없음. `npm run typecheck` + `npm run build` 통과.

## Random Team Slot-Based Type Conditions (Added: 2026-04-21)
- Replaced the single global `최소 타입` condition with per-slot type conditions for `/teams/random`.
- Each of the six result slots now has its own type dropdown so the user can independently require a specific type per slot.
- Replaced `matchesRequiredType` with a backtracking `findValidSlotAssignment` function that finds a valid assignment of sampled Pokemon to slots satisfying all per-slot type requirements.
- The retry loop remains unchanged; if no valid assignment is found within the attempt limit the existing error message is shown.
- All six slots default to `없음` so the behavior is identical to the previous global-off state when no slot conditions are set.

# Verification Guide

## When To Read This
- Read this when a task changes DB-backed routes, auth/session boundaries, or persisted-state APIs.
- Skip this for docs-only changes or isolated styling work that does not affect runtime behavior.

## Purpose
- Provide a reliable manual verification flow for the DB-backed daily, collection, and team routes.
- Standardize failure triage and command sequences after DB migrations or session logic changes.
- Ensure the hybrid runtime (snapshot + PostgreSQL) remains stable across development environments.

## Scope
- Routes: `/favorites`, `/daily`, `/my-pokemon`, `/teams`, `/teams/random`, `/my-teams`, `/my`
- APIs: `/api/daily/state`, `/api/teams/state`, `/api/pokedex/catalog`, `/api/pokedex/moves`, `/api/account/delete`

---

## 1. Mandatory Command Sequence (24-2)

When changing the DB schema, seed data, or session-related server logic, follow this exact order to avoid stale state or lock issues.

### A. Full Reset (Fresh Environment or Major Schema Change)
1. `docker compose down -v` (Optional: only if you need a completely clean DB volume)
2. `docker compose up -d`
3. `npm run db:migrate`
4. `npm run db:seed:pokedex`
5. `npm run db:seed:items`
6. `npm run db:seed:moves`
7. **Windows Only:** Stop any running Next.js processes (check Task Manager for `node.exe`).
8. `npm run dev` (or `npm run build && npm run start` for performance checks)

### B. Incremental Schema Change
1. `npm run db:migrate`
2. **Windows Only:** Restart the Next.js dev server.
3. Check the affected route immediately.

### C. Seed/Catalog Data Update
1. `npm run db:seed:pokedex` (or items/moves as needed)
2. Clear any server-side cache if `unstable_cache` was used (or restart the server).

### D. Upstream Dataset Refresh
1. Run the matching `sync:*` command only for the domain you intend to refresh.
2. Then run the matching `db:seed:*` import command.
3. Restart the server if the affected route uses cached catalog helpers.
4. Recheck the affected route/API immediately.

---

## 2. Failure Triage (24-1, 24-7)

If a feature fails after a migration or update, use this checklist to identify the root cause.

| Symptom | Probable Cause | Diagnostic Step | Fix |
| :--- | :--- | :--- | :--- |
| **500 Internal Server Error** | Missing Table or Column | Check server logs for `Relation "..." does not exist` | Run `npm run db:migrate` |
| **Empty Data / Broken Images** | Missing Catalog Seeds | Check `/api/pokedex/catalog` for empty arrays | Run `npm run db:seed:pokedex` |
| **Old Data Still Appears** | Next.js / Windows Cache | Change a UI string; if it doesn't update, it's a lock issue | Stop node.exe and restart `npm run dev` |
| **401 Authentication Required** | Missing Auth Session | Check `/api/auth/session` and confirm `authenticated: true` | Sign in again through the configured auth flow and retry |
| **Signed in but still treated as signed out** | Inactive soft-deleted account or invalidated session | Check `users.is_active`, `users.deleted_at`, and retry `GET /api/auth/session` | Reactivate the account or create a valid active-user session |

---

## 3. Change-Specific Verification (24-3, 24-4)

### A. DB Schema Change (e.g., New column in `team_members`)
1. Run `npm run db:migrate`.
2. Open `/teams` and save a new draft.
3. Refresh the page and confirm the saved data still reflects the new schema.
4. Check `/api/teams/state` to ensure the JSON payload includes the new field.

### B. Catalog Data Change (e.g., Updated Pokemon stats)
1. Run `npm run db:seed:pokedex`.
2. Open a detail page (e.g., `/pokemon/pikachu`).
3. Verify the stats match the new source data.
4. Verify the Pokedex list (`/pokedex`) still paginates correctly.

### C. Session Logic Change (e.g., Cookie boundary hardening)
1. Clear auth cookies or sign out.
2. Open `/daily` and verify the page shows a login CTA instead of persisted progress.
3. Confirm `GET /api/daily/state` returns `401` while signed out.
4. Sign in through the configured auth flow.
5. Capture a Pokemon, open `/my-pokemon`, and verify the captured Pokemon appears under the same account.
6. Mark the same user inactive in `users.is_active` or set `deleted_at`, then retry `GET /api/auth/session` and confirm it returns `authenticated: false`.
7. Recheck `/daily` or `/my` and confirm the route now falls back to the login-required state instead of resolving the old session.
8. While signed in on `/my`, trigger the account deletion request and confirm `POST /api/account/delete` returns success, the auth cookie is cleared, and `/my` falls back to the login-required state on the next visit.
9. Sign in again with the same account while `deleted_at` is still inside the grace period and confirm the account is reactivated, a new session is issued, and `/my?accountRestored=true` shows the recovery notice.
10. For purge verification, use a non-production local test account, set `deleted_at` older than 30 days, delete the matching `users` row in maintenance flow, and confirm related favorites, daily state, teams, and sessions are removed by cascade.

### D. Auth Failure UX
1. Trigger `GET /api/auth/callback/google?state=wrong&code=test` and confirm the home route shows the login-failure banner with the invalid-state message.
2. Trigger `GET /api/auth/callback/google?state=wrong` or the matching missing-code case and confirm the home route shows the missing-code or retry guidance instead of failing silently.
3. Force a sign-in start failure in the current environment and confirm the header account panel shows the inline start-failed message.
4. Use an inactive account outside the grace period and confirm the login start or callback path surfaces the inactive-account guidance instead of silently looping.
5. While authenticated on `/favorites`, `/daily`, `/my-pokemon`, `/teams`, or `/my-teams`, invalidate the session and retry a saved-state action; confirm the route falls back to its login CTA and shows the session-expired message before the user chooses to sign in again.

### E. Account Hub Smoke Check
1. While signed out, open `/my` and confirm the page shows the login-required state instead of account details.
2. Sign in through the configured auth flow, open `/my`, and confirm the account hub renders the current profile, activity summary, and navigation links without a hydration or loading mismatch.
3. From `/my`, trigger the delete request and confirm `POST /api/account/delete` succeeds, the auth cookie is cleared, and the next `/my` visit falls back to the signed-out state.
4. Sign in again with the same account while `deleted_at` is still inside the 30-day grace period and confirm `/my?accountRestored=true` shows the recovery notice after the new session is issued.
5. After recovery, re-open `/favorites`, `/daily`, and `/my-teams` and confirm previously retained persisted data is still available under the restored account.

---

## 4. Route Smoke Flow (Baseline)

### `/daily` & `/my-pokemon`
- While signed out, open `/daily` and verify the login CTA renders.
- After sign-in, `GET /api/daily/state` should return a valid JSON state.
- Capture/Reroll/Reset should all work and return `200 OK` while authenticated.
- Open `/my-pokemon`. Captured cards must load via `/api/pokedex/catalog` on demand.

### `/teams` & `/my-teams`
- While signed out, open `/teams` and verify the login CTA renders.
- After sign-in, open `/teams`. The first render must ship a reduced option payload (verify in Network tab).
- Select a Pokemon. Verify `/api/pokedex/catalog?view=teams` is called.
- Save a team. Verify the redirect to `/teams?teamId=...`.
- Open `/my-teams`. The saved team must appear and load its members correctly.

### `/my`
- While signed out, open `/my` and verify the account hub stays in its auth-required fallback state.
- After sign-in, open `/my` and verify the account summary, personal navigation, and account-delete entry render together.
- Trigger account deletion only with a local test account and confirm the next `/my` load does not reuse the invalidated session.

## Auth Mode Note
- In provider mode, the sign-in path is Google OAuth through `GET /api/auth/sign-in`.
- `GET /api/auth/sign-in` is the canonical user-facing sign-in entry in both auth modes.
- When provider auth is not configured, the header's `개발용 로그인` entry and the development fallback `POST /api/auth/sign-in` path remain local verification boundaries on top of that same policy.

## 5. Environment Notes (24-6)
- **Windows `.next/trace` Lock:** If the server hangs or fails to reflect changes, the trace file is likely locked. Kill all `node` processes and restart.
- **Auth Requirement:** Persisted routes now require a valid `kxoxxy-auth-session`; signed-out behavior should be a login CTA plus `401` from the matching state API.

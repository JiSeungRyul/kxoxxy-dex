# Verification Guide

## Purpose
- Provide a reliable manual verification flow for the DB-backed daily, collection, and team routes.
- Standardize failure triage and command sequences after DB migrations or session logic changes.
- Ensure the hybrid runtime (snapshot + PostgreSQL) remains stable across development environments.

## Scope
- Routes: `/daily`, `/my-pokemon`, `/teams`, `/my-teams`, `/my`
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
| **401 Authentication Required** | Missing Auth Session | Check `/api/auth/session` and confirm `authenticated: true` | Sign in again through Google and retry |
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
4. Sign in through Google.
5. Capture a Pokemon, open `/my-pokemon`, and verify the captured Pokemon appears under the same account.
6. Mark the same user inactive in `users.is_active` or set `deleted_at`, then retry `GET /api/auth/session` and confirm it returns `authenticated: false`.
7. Recheck `/daily` or `/my` and confirm the route now falls back to the login-required state instead of resolving the old session.
8. While signed in on `/my`, trigger the account deletion request and confirm `POST /api/account/delete` returns success, the auth cookie is cleared, and `/my` falls back to the login-required state on the next visit.
9. Sign in again with the same account while `deleted_at` is still inside the grace period and confirm the account is reactivated, a new session is issued, and `/my?accountRestored=true` shows the recovery notice.
10. For purge verification, use a non-production local test account, set `deleted_at` older than 30 days, delete the matching `users` row in maintenance flow, and confirm related favorites, daily state, teams, and sessions are removed by cascade.

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

## 5. Environment Notes (24-6)
- **Windows `.next/trace` Lock:** If the server hangs or fails to reflect changes, the trace file is likely locked. Kill all `node` processes and restart.
- **Auth Requirement:** Persisted routes now require a valid `kxoxxy-auth-session`; signed-out behavior should be a login CTA plus `401` from the matching state API.

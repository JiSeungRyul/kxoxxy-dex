# Verification Guide

## Purpose
- Provide a reliable manual verification flow for the DB-backed daily, collection, and team routes.
- Standardize failure triage and command sequences after DB migrations or session logic changes.
- Ensure the hybrid runtime (snapshot + PostgreSQL) remains stable across development environments.

## Scope
- Routes: `/daily`, `/my-pokemon`, `/teams`, `/my-teams`
- APIs: `/api/daily/state`, `/api/teams/state`, `/api/pokedex/catalog`, `/api/pokedex/moves`

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

---

## 2. Failure Triage (24-1, 24-7)

If a feature fails after a migration or update, use this checklist to identify the root cause.

| Symptom | Probable Cause | Diagnostic Step | Fix |
| :--- | :--- | :--- | :--- |
| **500 Internal Server Error** | Missing Table or Column | Check server logs for `Relation "..." does not exist` | Run `npm run db:migrate` |
| **Empty Data / Broken Images** | Missing Catalog Seeds | Check `/api/pokedex/catalog` for empty arrays | Run `npm run db:seed:pokedex` |
| **Old Data Still Appears** | Next.js / Windows Cache | Change a UI string; if it doesn't update, it's a lock issue | Stop node.exe and restart `npm run dev` |
| **Progress Not Saved** | Session/Cookie Issue | Check DevTools -> Application -> Cookies for `kxoxxy-anonymous-session` | Clear Cookies and refresh to mint a new one |
| **"Session ID is required"** | Legacy Client Version | Check if the browser is sending `sessionId` in the JSON body | Refresh the page; the new cookie-based client will fix it |

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
1. Clear all browser cookies and local storage.
2. Open `/daily` and verify a `kxoxxy-anonymous-session` cookie is created.
3. Capture a Pokemon.
4. Open `/my-pokemon` and verify the captured Pokemon appears (proving session sharing).
5. Verify `/api/daily/state` returns data without requiring an explicit `sessionId` query param.

---

## 4. Route Smoke Flow (Baseline)

### `/daily` & `/my-pokemon`
- Open `/daily`. Verify the `kxoxxy-anonymous-session` `httpOnly` cookie exists.
- `GET /api/daily/state` should return a valid JSON state.
- Capture/Reroll/Reset should all work and return `200 OK`.
- Open `/my-pokemon`. Captured cards must load via `/api/pokedex/catalog` on demand.

### `/teams` & `/my-teams`
- Open `/teams`. The first render must ship a reduced option payload (verify in Network tab).
- Select a Pokemon. Verify `/api/pokedex/catalog?view=teams` is called.
- Save a team. Verify the redirect to `/teams?teamId=...`.
- Open `/my-teams`. The saved team must appear and load its members correctly.

## 5. Environment Notes (24-6)
- **Windows `.next/trace` Lock:** If the server hangs or fails to reflect changes, the trace file is likely locked. Kill all `node` processes and restart.
- **Anonymous Migration:** The server allows a one-time handoff of `localStorage["kxoxxy-anonymous-session"]`. To test this, manually set the local storage key before loading the page without a cookie.

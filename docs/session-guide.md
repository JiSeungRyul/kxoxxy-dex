# Session Guide

## One-line Summary
KxoxxyDex is a hybrid Pokedex app where runtime catalog reads are DB-backed,
while snapshot generation and DB-backed runtime flows currently coexist.

## Purpose
- Give a new AI agent enough context to work safely and quickly.
- Point to the right source document instead of repeating full project history.

## Read Order
1. docs/project-overview.md
2. docs/current-product.md
3. docs/architecture.md

(Optional)
4. docs/database-plan.md
5. docs/implemented-tasks.md
6. docs/verification-guide.md
7. docs/performance-guide.md

If the task depends on local PostgreSQL, read `docs/database-plan.md` for the required startup order:
`docker compose up -d` -> `npm run db:migrate` -> `npm run db:seed:pokedex` -> `npm run db:seed:items` -> `npm run db:seed:moves`.

If the task depends on /daily, /my-pokemon, /teams, or their state APIs, read docs/verification-guide.md before changing the verification flow.

If the task depends on route or API performance measurement, read docs/performance-guide.md before changing the measurement workflow.

## Current Runtime Truth
- The repository is in a hybrid state.
- `/` and `/pokedex` load list data through PostgreSQL-backed catalog queries.
- `/pokemon/[slug]` loads detail data from PostgreSQL-backed catalog queries.
- `/daily` now loads a dex-number-only daily candidate index through PostgreSQL-backed catalog queries and fetches encounter/recent-capture detail on demand through `app/api/pokedex/catalog`.
- `/daily` stores anonymous-session encounter and capture state in PostgreSQL, including shiny flags, and the daily/team state APIs now issue or reuse a shared server-managed `httpOnly` anonymous-session cookie.
- `/my-pokemon` now loads captured Pokemon detail on demand through `app/api/pokedex/catalog` after anonymous-session collection state is loaded, instead of shipping the gallery catalog on first render.
- `/my-pokemon` reads captured collection state through the same anonymous-session API used by daily.
- `/teams` now loads a small option list with dex number, Korean name, generation, and Pokedex-name metadata through PostgreSQL-backed catalog queries and fetches selected team-member detail on demand through `app/api/pokedex/catalog`.
- `/teams` and `/my-teams` read and write team data through the same anonymous-session-backed PostgreSQL APIs and shared server-managed `httpOnly` cookie boundary, including per-member level configuration.
- The current client no longer creates new anonymous-session ids in local storage and only forwards an older stored session id once when migrating a browser onto the shared cookie boundary.
- `/teams` now has a first-pass general form selector for Rotom appliance forms, a small regional-form shortlist including `나옹(알로라/가라르)`, a small legendary/mythical shortlist (`기라티나 오리진폼`, `쉐이미 스카이폼`), and `팔데아 켄타로스` breed forms, and the move API uses slot + `formKey` input so matching form-specific move overrides can be exposed where the current MVP supports them.
- Team persistence assumes the `teams` and `team_members` tables have been migrated and the local dev server has been restarted when Windows reload issues occur.
- Local `npm run start` measurement on 2026-03-26 showed first-response payload sizes of 478645 bytes for `/`, 25956 bytes for `/daily`, 21847 bytes for `/my-pokemon`, and 75230 bytes for `/teams`; see `docs/performance-guide.md` for the full dev/start table and method.
- Collection state is still mirrored into `localStorage` as a fallback compatibility layer.
- Snapshot generation still starts from PokeAPI and writes `data/pokedex.json`.
- Additional item and move snapshot generation now writes `data/item-catalog.json` and `data/move-catalog.json`.
- The generated move snapshot is local-only, and `npm run db:seed:moves` now regenerates it automatically before importing into PostgreSQL.
- PostgreSQL import still starts from local snapshot files and now populates `pokedex_*`, `item_*`, and `move_*` catalog tables.

## Files To Verify First
- `app/page.tsx`
- `app/pokedex/page.tsx`
- `app/pokemon/[slug]/page.tsx`
- `app/daily/page.tsx`
- `app/my-pokemon/page.tsx`
- `app/teams/page.tsx`
- `app/my-teams/page.tsx`
- `app/api/teams/state/route.ts`
- `features/pokedex/server/repository.ts`
- `features/pokedex/components/pokedex-page.tsx`
- `features/pokedex/types.ts`
- `scripts/sync-pokedex.mjs`
- `scripts/import-pokedex-to-db.mjs`
- `scripts/sync-items.mjs`
- `scripts/import-items-to-db.mjs`
- `scripts/sync-moves.mjs`
- `scripts/import-moves-to-db.mjs`

## Working Constraints
- Prefer small, incremental changes over broad rewrites.
- Do not rewrite large parts of the codebase unless a migration step is explicitly planned.
- Always check `docs/architecture.md` before modifying data flow.
- Do not assume the database is active unless that is explicitly verified for the task at hand.
- Treat `features/pokedex/types.ts` as the contract for snapshot and catalog payload shape.
- Keep route files in `app/` thin and push product logic into `features/pokedex/`.
- Preserve the current server/client boundary:
  - server data access in `features/pokedex/server/`
  - interactive state in client components
- Do not describe the app as fully DB-backed.
- Do not describe the app as fully snapshot-backed.
- When changing docs, keep the hybrid runtime model explicit.

## Known Risks To Keep In Mind
- Source-of-truth ambiguity:
  - snapshot exists
  - DB catalog exists
  - different routes currently use different read paths
- Environment coupling:
  - `lib/db/client.ts` requires `DATABASE_URL`
  - DB-related runtime assumptions must be stated explicitly
- User state migration:
  - collection progress is server-backed for anonymous sessions, but not yet account-linked
- Daily and team migration caveat:
  - the daily and team APIs depend on migrated anonymous-session tables and can fail until DB migrations are applied
- Local runtime caveat:
  - on Windows, DB-related changes may require a clean Next.js dev server restart because `.next/trace` locking can interfere with reload behavior
- Doc drift:
  - architecture and product docs must be updated when runtime paths change

## Latest Session Handoff (2026-04-02)
- The anonymous-session hardening work in backlog item `22` is fully completed.
- Current session behavior:
  - the daily/team state APIs issue or reuse a shared `httpOnly` `kxoxxy-anonymous-session` cookie
  - the client no longer creates new anonymous session ids in `localStorage`
  - an older `localStorage["kxoxxy-anonymous-session"]` value is forwarded only once to migrate a browser onto the cookie boundary
- Local verification already completed for the cookie-based session flow:
  - `npm run typecheck`
  - `npm run build`
  - local smoke checks for `/daily`, `/my-pokemon`, `/teams`, `/my-teams`
  - `GET /api/daily/state`
  - `GET /api/teams/state`
  - `/api/teams/state` save/delete round-trip
- Backlog item `23` is also fully defined at the planning/documentation level.
- The key `23` decision is:
  - future durable ownership should move to `user_id`
  - legacy anonymous-session data migration/merge is intentionally out of scope because this is not a live production app
- The main documents for that ownership decision are:
  - `docs/database-plan.md`
  - `docs/architecture.md`
- The next practical task is backlog item `24`: tighten post-migration and post-restart verification guidance.

## Authentication Direction (Added: 2026-04-03)
- The preferred auth direction for this repo is minimal auth plus server-managed authenticated sessions, not a broad multi-provider rollout on day one.
- The intended runtime shape is:
  - pre-login fallback -> existing `kxoxxy-anonymous-session` cookie
  - authenticated session -> separate server-managed auth session that resolves a durable `user_id`
- Auth should be introduced without removing the current anonymous-session flow immediately.
- Once auth exists, new authenticated writes should move directly to `user_id` ownership instead of extending long-lived dual ownership.
- Legacy anonymous-session data merge remains out of scope unless a later product requirement explicitly reopens it.
- Minimal auth groundwork now exists at the schema level:
  - `users`
  - `auth_accounts`
  - `sessions`
- A minimal authenticated-session read boundary now also exists at `/api/auth/session`.
- The header now has a development-only minimal auth panel that can create and clear a server-managed auth session for local verification.
- Local verification for that boundary now includes:
  - unauthenticated `GET /api/auth/session` -> `authenticated: false`
  - temporary local `users` + `sessions` rows plus `kxoxxy-auth-session` cookie -> `authenticated: true`
- Local verification for the current minimal login UI now also includes:
  - `POST /api/auth/session` -> auth cookie issued
  - follow-up `GET /api/auth/session` -> `authenticated: true`
  - `DELETE /api/auth/session` -> auth cookie cleared
  - final `GET /api/auth/session` -> `authenticated: false`
- A shared ownership resolver now exists for later `user_id` persistence work:
  - authenticated request -> `ownerType: "user"` with `userId`
  - unauthenticated request -> `ownerType: "anonymous"` with fallback `sessionId`
- Favorites, daily, and my-pokemon state now use that shared ownership boundary.
- Favorites now persist for authenticated requests through `user_id`.
- Daily and my-pokemon state now also persist for authenticated requests through `user_id`, while anonymous daily/my-pokemon state still remains on `anonymous_session_id`.
- Teams and my-teams state now also persist for authenticated requests through `user_id`, while anonymous team state still remains on `anonymous_session_id`.
- Real provider-backed Google auth is now live for local runtime verification, and authenticated favorites, daily/my-pokemon, and teams ownership can now be exercised without the old development-only auth path.
- Local ownership-priority verification now also confirms the intended fallback order in one browser session:
  - anonymous cookies can hold favorites, daily capture state, and saved teams
  - adding `kxoxxy-auth-session` makes the same browser read the authenticated `user_id` state instead of the anonymous state
  - clearing the auth cookie reveals the original anonymous state again

## Ownership Transition Status (Added: 2026-04-03)
- Backlog item `26` is now fully completed.
- Current authenticated `user_id` persistence is live for:
  - favorites
  - daily / my-pokemon state
  - teams / my-teams state
- Current anonymous persistence is still kept as the no-auth fallback through `kxoxxy-anonymous-session`.
- The remaining auth follow-up is no longer the `user_id` write transition itself.
- The next larger follow-up is replacing the current development-only auth flow with a real provider-backed authentication boundary when backlog item `25` is revisited at runtime quality level.

## Account Auth Replacement Plan (Added: 2026-04-05)
- Backlog items `29-1` through `29-3` are now defined at the planning level.
- Keep:
  - `resolveAuthenticatedUserSession()` as the current-session read boundary
  - the shared ownership resolver that prefers authenticated `userId`
  - `/api/auth/session` as the current-session read endpoint for the header and other client UI
- Replace:
  - `createDevelopmentAuthSession()` as the session-issuance path
  - the old development-only `POST /api/auth/sign-in` login flow
  - the old development-only `POST /api/auth/sign-out` logout flow
  - the header button copy and click path that currently says `개발용 로그인`
- Preferred real-auth shape:
  - one minimal provider-backed sign-in entry
  - one sign-out entry
  - keep current-session reads separate from session issuance
- The replacement goal is to preserve the existing `user_id` ownership behavior for favorites, daily/my-pokemon, and teams while swapping only the auth-session issuance and lifecycle boundary.
- The current no-key groundwork now reflects that split:
  - `GET /api/auth/session` stays as the current-session read endpoint
  - `GET /api/auth/sign-in` and `POST /api/auth/sign-out` are the new issuance/lifecycle boundaries
  - provider env vars stay optional for now, and when they are empty the sign-in route keeps the current development fallback
- Google auth route groundwork is now live when provider env vars are present:
  - `GET /api/auth/sign-in` redirects to Google and sets an auth-state cookie
  - `GET /api/auth/callback/google` validates `state`, exchanges `code`, upserts `users` / `auth_accounts`, creates a local `sessions` row, and issues `kxoxxy-auth-session`
  - `POST /api/auth/sign-out` clears the local auth session
- Local verification for that provider-backed route layer currently covers:
  - `GET /api/auth/session` -> `authMode: "provider"`
  - `GET /api/auth/sign-in` -> Google redirect URL plus `kxoxxy-auth-state`
  - invalid-state callback guard -> redirect with `authError=invalid-state`
- Browser-driven Google login verification now also covers:
  - real Google callback -> local `users` / `auth_accounts` / `sessions` row creation
  - provider-backed `GET /api/auth/session` -> `authenticated: true`
  - provider-backed favorites toggle round-trip
  - provider-backed daily capture / release round-trip
  - provider-backed teams save / delete round-trip

## Persistence Auth Requirement Direction (Added: 2026-04-05)
- Product direction is now shifting away from long-lived anonymous persistence.
- Keep browse-only routes open without login:
  - `/`
  - `/pokedex`
  - `/pokemon/[slug]`
- Move persisted user-state routes toward auth-required behavior:
  - `/favorites`
  - `/daily`
  - `/my-pokemon`
  - `/teams`
  - `/my-teams`
- Under that direction, the intended steady state is:
  - unauthenticated user -> catalog browsing only plus login CTA for persistence features
  - authenticated user -> all persistence reads/writes resolved by `user_id`
- `29-8` policy is now fixed at the runtime level:
  - unauthenticated requests to persisted state APIs should no longer mint or reuse anonymous owners
  - persisted state routes should render auth-required empty/login states instead of anonymous saved data
  - browse-only routes remain public and unchanged
- That means the current anonymous persistence boundary should be treated as transitional implementation debt, not the desired product end state.
- Impacted runtime pieces when this cutover begins:
  - `app/api/favorites/state/route.ts`
  - `app/api/daily/state/route.ts`
  - `app/api/teams/state/route.ts`
  - `features/pokedex/server/ownership.ts`
  - `features/pokedex/server/anonymous-session.ts`
  - `features/pokedex/client/session.ts`
  - login CTA / empty-state copy in the favorites, daily, collection, and team-builder UI
- The preferred sequence is:
  - finish real provider-backed auth verification first
  - gate favorites behind authenticated session
  - gate daily / my-pokemon behind authenticated session
  - gate teams / my-teams behind authenticated session
  - then remove the remaining anonymous persistence fallback paths and legacy local-storage handoff logic
- Favorites is now the first route fully switched to auth-required persistence:
  - `/api/favorites/state` now returns `401` with `authRequired: true` when no authenticated session exists
  - `/favorites` now shows a login CTA instead of anonymous saved data
  - favorites toggles from the main Pokedex and Pokemon detail page now use Google sign-in as the entry point when auth is missing


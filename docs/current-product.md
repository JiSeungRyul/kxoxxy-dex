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
- Daily encounter flow with anonymous-session-backed capture progress and shiny chance
- My Pokemon gallery based on captured Pokemon stored for the current anonymous session
- Team builder for saving up to six Pokemon with team-level default-or-Gen 6-9 format selection plus per-member level, nature, item, ability, moves, IVs, EVs, and level-based battle stat display
- Theme toggle
- Contact, terms, and privacy pages

## Current Product Behavior
- The main browsing experience is server-driven for list queries and detail lookup.
- Daily encounter now uses anonymous-session-backed server persistence, a dex-number-only initial candidate payload, and on-demand encounter/recent-capture detail fetches.
- My Pokemon now reads the same anonymous-session-backed server collection state as daily and fetches captured gallery card detail on demand instead of shipping the gallery catalog on first render.
- Team builder and My Teams now store team data per anonymous session in PostgreSQL, and the team builder route now uses a small option payload with dex number, Korean name, generation, and Pokedex-name metadata plus on-demand selected-detail fetches instead of shipping the full team-builder catalog on first render.
- A minimal authenticated-session read boundary now exists at `/api/auth/session`, but it is not yet connected to a real login/logout flow.
- The site header now exposes a development-only minimal auth panel that can create and clear a server-managed auth session for local verification.
- Favorites, daily, and team routes now resolve ownership through a shared authenticated-first / anonymous-fallback server helper.
- Favorites now persist separately for authenticated users through `user_id`.
- Daily encounter state and My Pokemon collection state now also persist separately for authenticated users through `user_id`.
- Team builder and My Teams state now also persist separately for authenticated users through `user_id`.
- The daily and team state APIs now issue or reuse a shared server-managed `httpOnly` anonymous-session cookie, and the current client no longer generates new `sessionId` values in local storage.
- When an older browser still has a legacy `kxoxxy-anonymous-session` local-storage value, the client now forwards it only during the first state load so the server can migrate that browser onto the shared cookie boundary.
- Team builder now supports a team-level default-or-Gen 6-9 format selection with a safe default fallback for older saved teams, plus per-member level input preserved in saved teams.
- Team builder now blocks saving duplicate species and duplicate held items in `대전 싱글` and `대전 더블`.
- Team builder now starts new members at level `50` in every mode, allows manual level adjustment up to `100` in `자유` and `스토리`, and caps manual level adjustment at `50` in `대전 싱글` and `대전 더블`.
- Team builder now labels hidden abilities in the ability selector, shows Korean ability descriptions under the selector, and switches the available ability list when a Mega form is selected.
- Team builder now uses a search-based item selector backed by PostgreSQL item options, with the visible item candidate list narrowed differently for `자유`, `스토리`, and battle modes.
- Team builder now uses Pokemon-specific searchable move selectors backed by PostgreSQL move and learnset data, filters visible move candidates by the selected team format, blocks duplicate move selection within the same Pokemon slot, and styles selected move fields with the chosen move type color.
- Team builder move names now apply local Korean override fallbacks for newer moves when PokeAPI Korean names are missing, so visible selector labels stay Korean-first instead of falling back to English.
- Team builder now exposes a first-pass general non-Mega form selector for Rotom appliance forms, a small regional-form shortlist (`나옹(알로라/가라르)`, `알로라 라이츄`, `알로라 식스테일/나인테일`, `히스이 가디/윈디`, `팔데아 우파`, `히스이 조로아/조로아크`), a small legendary/mythical shortlist (`기라티나 오리진폼`, `쉐이미 스카이폼`), and `팔데아 켄타로스` breed forms, and saved teams persist that selection through `formKey`.
- Team builder move options now use that Rotom `formKey` to expose appliance signature moves such as `오버히트`, `하이드로펌프`, `리프스톰`, `눈보라`, and `에어슬래시` in the matching slot.
- Team builder move options now also add a small regional-form override set where a clear learnset gap was identified: `알로라 라이츄 -> 사이코키네시스`, `알로라 식스테일 -> 프리즈드라이`, `알로라 나인테일 -> 오로라베일/문포스`, `히스이 윈디 -> 양날박치기`, `히스이 조로아크 -> Bitter Malice`.
- General non-Mega form support still remains intentionally limited in this MVP step; broader regional, legendary, and other multi-form groups plus form-specific learnset exceptions such as `버드렉스 rider` and more ambiguous cases such as `지가르데` stay in the follow-up backlog.
- Daily encounter state stores whether the current encounter is shiny.
- My Pokemon supports releasing captured Pokemon so they can enter the daily candidate pool again later.
- Captured Pokemon progress and saved teams still do not sync across devices or accounts.
- The app currently presents one Korean-first experience and does not support runtime locale switching.
- Collection state is mirrored back into local browser storage as a fallback during the current hybrid phase.

## Current Constraints
- Real provider-backed authentication is now available locally through Google OAuth, though production hardening is still not complete.
- Minimal auth schema groundwork exists, and the header auth panel now acts as the real Google sign-in entry in provider mode.
- Server-backed authenticated user persistence is live for favorites, daily/my-pokemon, and teams, but the product direction is now to require login for those persisted features instead of keeping anonymous persistence as a long-term fallback.
- The preferred next step is to finish real provider-backed auth and then cut persistence features over to authenticated `user_id` ownership only.
- That cutover policy is now fixed: browse routes stay public, but persisted state routes should move to auth-required behavior and stop exposing anonymous saved state as a product feature.
- The preferred replacement path is to keep the current session-read and `user_id` ownership boundaries, and replace only the development-only sign-in/sign-out flow with a real provider-backed auth flow.
- The current auth routes now already reflect that split:
  - `GET /api/auth/session` for current-session reads
  - `GET /api/auth/sign-in` for provider redirect entry, with `POST` fallback for development auth
  - `POST /api/auth/sign-out` for sign-out
- Google provider-backed auth routing is now implemented for local verification:
  - `/api/auth/sign-in` can start the Google OAuth redirect flow
  - `/api/auth/callback/google` can materialize a local authenticated session after callback
  - a browser-driven Google login round-trip is verified for session creation and user-owned favorites / daily / teams state
- Automated tests are not present.
- Catalog data operations are still split across snapshot generation and DB import workflows.
- Anonymous daily persistence and anonymous team persistence still exist in the current implementation, but they are now considered transitional rather than part of the desired steady state.
- The next runtime change should convert that transitional anonymous persistence into explicit auth-required UX for favorites, daily/my-pokemon, and teams.
- That cutover has now started with favorites:
  - favorites read/write is now login-required
  - `/favorites` renders a login CTA instead of anonymous saved state
  - favorite toggles from browsing/detail routes now redirect into Google sign-in when auth is absent
  - navigation now exposes favorites as an independent top-level menu instead of grouping it under the daily submenu
- Daily and team persistence require the new DB tables to be migrated before the API routes can work.
- After DB schema changes, the local Next.js dev server may need a restart on Windows before the daily and team routes behave correctly.

## Current Risks
- Anonymous session identity is browser-scoped and is not durable across devices or account changes.
- Anonymous ownership still exists as a runtime fallback path, and the next cutover should remove it from persisted product features so favorites, collection state, and teams become clearly account-bound.
- The current auth flow is now provider-backed locally, but it still needs product-level tightening around login-required persistence and broader runtime hardening.
- Local development remains sensitive to Windows `.next/trace` lock issues during server restart.

## Current Content Sources
- Pokemon catalog content originates from PokeAPI-derived snapshot generation.
- Item and move catalog content now also originates from PokeAPI-derived snapshot generation and PostgreSQL import.
- Temporary Korean ability-description support still includes frontend-held translation logic.

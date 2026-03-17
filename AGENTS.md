# AGENTS.md

## Project Scope
- This repository is a Next.js 15 + React 19 + TypeScript app.
- The app is a Pokedex-style product centered on the `features/pokedex` domain.
- Prefer small, targeted changes that preserve the current product shape unless the task explicitly asks for a redesign.

## Source Of Truth
- `data/pokedex.json` is the local snapshot consumed by the app at runtime.
- `features/pokedex/server/repository.ts` is the read path for snapshot data.
- `scripts/sync-pokedex.mjs` is the write path that refreshes snapshot data from PokeAPI.
- Keep the snapshot schema aligned with `features/pokedex/types.ts`.

## Documentation Priority
- Read `docs/session-guide.md` first for session-level constraints and current runtime notes.
- Read `docs/architecture.md` before changing data flow, repository behavior, or route-level loading strategy.
- Use `docs/current-product.md` for user-facing scope and `docs/database-plan.md` for future DB direction.
- Treat docs as guidance, but verify behavior in code when a document and implementation appear to differ.

## Local Setup Baseline
- Treat local PostgreSQL as required for DB-backed routes in the current hybrid runtime.
- On a fresh environment, the correct setup order is:
  1. `npm install`
  2. create `.env` from `.env.example` if needed
  3. start PostgreSQL with `docker compose up -d`
  4. apply schema and seed catalog data with one of:
     - `sh scripts/setup-local-db.sh --skip-compose`
     - `.\scripts\setup-local-db.ps1 -SkipCompose`
  5. start the app with `npm run dev`
- If PostgreSQL is not running yet, the helper scripts can perform the DB startup as part of setup:
  - `sh scripts/setup-local-db.sh`
  - `.\scripts\setup-local-db.ps1`
- When debugging startup failures, verify both the DB container state and whether migrations and seed import have been applied.

## Structure Conventions
- Keep route entry points in `app/` thin. Fetch data there and hand it off to feature modules.
- Put product-specific UI and logic under `features/pokedex/`.
- Keep reusable or cross-cutting helpers in `lib/` only when they are not specific to the pokedex feature.
- Prefer extending existing files in `features/pokedex/components`, `constants.ts`, `types.ts`, and `utils.ts` before creating parallel abstractions.

## Server And Client Boundaries
- Preserve the current split between server data loading and client interactivity.
- Server-only data access belongs in `features/pokedex/server/` and should stay compatible with `server-only`.
- Interactive filtering, sorting, and pagination belong in client components.
- Do not move file-system access or cache logic into client components.

## UI And Styling
- Preserve the existing visual language defined in `tailwind.config.ts` and `app/globals.css`.
- Reuse the current color tokens (`canvas`, `ink`, `ember`, `pine`, `sand`, `smoke`, `panel`) and font variables before adding new design tokens.
- Match the current layout style: spacious, editorial, warm-toned, and legible on desktop and mobile.
- Prefer Tailwind utility updates over introducing separate styling systems.

## Data And Content Rules
- Treat `PokemonSummary`, `PokedexFilterOptions`, and `PokedexSnapshot` as stable contracts unless the task explicitly requires a schema change.
- If changing filter, sort, pagination, or label behavior, update the related constants and utils together so behavior stays internally consistent.
- User-facing copy is expected to be Korean-first in this project. Preserve existing language direction when editing labels or metadata.
- When touching Korean text, avoid accidental encoding regressions and keep files UTF-8 compatible.

## Dependencies And Abstractions
- Avoid new dependencies unless the change cannot be done cleanly with the current stack.
- Prefer straightforward React and TypeScript code over generalized abstractions.
- Add comments only when the code's intent is not obvious from the implementation.

## Change Scope Safety
- Keep changes narrowly scoped to the task.
- Do not rewrite large parts of the codebase unless the task explicitly requires it.
- Prefer extending existing modules over introducing parallel structure.
- Before changing data flow or persistence assumptions, verify the current behavior in `features/pokedex/server/repository.ts`.

## Verification
- Use the lightest verification that meaningfully covers the change.
- Preferred checks:
- `npm run typecheck` for TypeScript changes.
- `npm run lint` if linting is configured and relevant to the edit.
- `npm run build` for route, config, or production behavior changes.
- `npm run sync:pokedex` only when intentionally refreshing dataset contents.

## Local Artifact Hygiene
- Do not commit generated logs, local Codex state, or transient build output.
- Treat `.codex/`, `.code/`, `.next/`, logs, and dataset refresh byproducts as local artifacts unless the task explicitly asks for them.
- Do not revert unrelated user changes in the worktree.

## Multi-Session Awareness
- Assume future agents will rely on docs and touched files to understand what changed.
- Keep related docs updated when a change affects runtime behavior, data flow, or project assumptions.
- Do not leave partial architectural changes undocumented when they affect how later sessions should reason about the system.

## Communication
- State assumptions when they affect behavior, scope, or data shape.
- Call out risks around schema changes, caching, and dataset regeneration.
- When verification is skipped or blocked, say so explicitly.

## Task Checklist
- Confirm the relevant source files and docs before editing.
- Keep the change as small as possible.
- Verify the change with the lightest meaningful check.
- Note any assumptions, skipped verification, or follow-up risks in the final handoff.

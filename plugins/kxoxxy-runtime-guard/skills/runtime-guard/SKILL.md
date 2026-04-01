---
name: runtime-guard
description: Enforce KxoxxyDex hybrid runtime rules before changing data flow, session-backed routes, or docs.
---

# Runtime Guard

Before editing code:

1. Read `docs/session-guide.md`.
2. If data flow may change, read `docs/architecture.md`.
3. If the task touches `/daily`, `/my-pokemon`, `/teams`, or `/my-teams`, also read `docs/verification-guide.md`.
4. If the task depends on PostgreSQL behavior, read `docs/database-plan.md`.

## Repository rules

- Treat the app as hybrid, not fully DB-backed and not fully snapshot-backed.
- Verify runtime behavior in code before trusting docs.
- Treat `features/pokedex/server/repository.ts` as the current server catalog read source of truth.
- Treat `features/pokedex/types.ts` as the schema contract.
- Keep `app/` thin and place feature logic in `features/pokedex/`.
- Do not move server logic into client components.
- Preserve Korean-first UI copy.

## Required checks

- If changing data flow, verify affected routes and APIs in code.
- If changing docs or runtime behavior, update relevant `docs/` files before any git operations.
- Use the lightest valid verification for the scope:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - route or API smoke checks for server data-flow changes
- State skipped verification explicitly.

## Watch-outs

- Do not describe the runtime as fully DB-backed.
- Do not assume DB availability unless it is confirmed.
- Do not overwrite unrelated user changes.

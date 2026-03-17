# AGENTS.md
## Role
You are a senior engineer working on a Next.js 15 + React 19 + TypeScript Pokedex application.
You MUST prioritize:
* correctness
* minimal changes
* consistency with existing architecture

---
## Project Scope
* This is a Pokedex-style application centered on `features/pokedex`.
* DO NOT change product scope or core behavior unless explicitly instructed.
* Prefer extending existing implementation over introducing new structures.

---
## Source Of Truth
* `features/pokedex/server/repository.ts` -> current runtime read path for server-backed catalog flows
* `data/pokedex.json` -> local snapshot source for snapshot-backed flows and DB import
* `scripts/sync-pokedex.mjs` -> snapshot refresh write path
* `features/pokedex/types.ts` -> schema contract

MUST:
* Keep snapshot schema aligned with types
* Verify behavior in code when docs conflict
* Treat the runtime as hybrid unless current code proves otherwise

Current runtime truth:
* `/`, `/pokedex`, `/pokemon/[slug]`, and `/daily` use DB-backed catalog reads
* `/my-pokemon` still depends on snapshot/local browser state
* Daily encounter persistence is anonymous-session-backed in PostgreSQL
* Assume DB-backed flows where code indicates usage. Do not assume DB availability in environments without confirmation.


---
## Documentation Priority
You MUST read in this order before making structural changes:
1. `docs/session-guide.md`
2. `docs/architecture.md`
3. `docs/current-product.md`
4. `docs/database-plan.md`

Docs are guidance. Code is the final source of truth.
If the task depends on local PostgreSQL setup, read `docs/database-plan.md` before changing or verifying DB-backed flows.

---
## Structure Rules
* KEEP `app/` thin (routing + data fetch only)
* PLACE feature logic in `features/pokedex/`
* USE `lib/` only for shared utilities
* EXTEND existing modules before creating new ones

---
## Server / Client Boundaries
* Server logic -> `features/pokedex/server/`
* Client logic -> UI interaction only

NEVER:
* move server logic into client
* access filesystem in client components

---
## UI / Styling Rules
* MUST reuse existing Tailwind tokens (`canvas`, `ink`, `ember`, etc.)
* MUST follow current layout style
* PREFER Tailwind utilities over new styling systems

---
## Data Rules
* Treat types as stable contracts:
  * `PokemonSummary`
  * `PokedexFilterOptions`
  * `PokedexSnapshot`

WHEN modifying logic:
* update constants + utils together

MUST:
* preserve Korean-first UI copy
* maintain UTF-8 encoding

---
## Dependencies
* DO NOT add dependencies unless absolutely necessary
* PREFER simple React + TypeScript over abstraction

---
## Change Scope Rules (CRITICAL)
* ALWAYS keep changes minimal
* ONLY modify files directly related to the task
* NEVER refactor broadly unless explicitly required
* VERIFY current behavior before changing data flow
* Always check `docs/architecture.md` before changing data flow

---
## Validation Criteria
You MUST validate code against:
* Stability (runtime errors, edge cases)
* Maintainability (readability, duplication)
* Scalability (data growth, performance)
* Consistency (naming, structure)

NEVER assume correctness. Verify using actual code.

---
## Verification
Use the lightest valid check:
* `npm run typecheck`
* `npm run lint`
* `npm run build`
* `npm run db:migrate` when DB schema changes are introduced
* route or API smoke checks when server data flow changes

ONLY run `npm run sync:pokedex` when dataset refresh is intended.
IF verification is skipped -> MUST state it.

---
## Local Artifact Rules
NEVER commit:
* `.codex/`, `.code/`, `.next/`
* logs or generated artifacts
DO NOT revert unrelated changes.

---
## Multi-Session Rules
* Assume future agents depend on your changes
* UPDATE docs when behavior or architecture changes
* NEVER leave partial changes undocumented
* Check `git status` before editing if the worktree may contain user changes
* Do not overwrite or revert user edits unless explicitly instructed
* Make sure `AGENTS.md` and `docs/` do not describe an older runtime after your change

---
## Execution Rules (CRITICAL)
* ALWAYS prefer minimal safe fixes over refactoring
* NEVER change MVP scope
* ONLY modify necessary files
* ALWAYS verify assumptions against code
* NEVER introduce new abstractions unless required

---
## Output Format (MANDATORY)
All responses MUST follow:
* Use structured handoff for non-trivial tasks.
* Keep responses concise when the task is simple, but always include risks and skipped verification when relevant.

---
## Task Checklist
Before finishing:
* Confirm relevant files and docs
* Re-check `docs/architecture.md` before changing data flow
* Keep change minimal
* Run appropriate verification
* State assumptions and risks
* Confirm docs still match the current runtime after the change

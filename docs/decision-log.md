# Decision Log

## Purpose
- Keep condensed historical decisions and review outcomes out of `docs/session-guide.md`.
- Preserve implementation context that may still matter for follow-up work.
- Avoid redefining current runtime truth; use `docs/current-product.md`, `docs/architecture.md`, and `docs/database-plan.md` for that.

## When To Read This
- Read this only when a task depends on earlier design reasoning, migration history, or deferred follow-up scope.
- Skip this for ordinary implementation work if the current product and architecture docs already answer the question.

## Hybrid Runtime Direction
- Runtime catalog reads are already DB-backed for list/detail and current persisted-feature flows.
- Hybrid now mainly means DB-backed runtime reads plus snapshot-based generation/import.
- `sync:*` is dataset refresh work, while `db:seed:*` is normal local runtime/bootstrap work.

## Ownership And Auth Direction
- Persisted state is now account-bound through authenticated `user_id`.
- Anonymous-session persistence and local-storage handoff are historical steps, not active runtime behavior.
- The preferred auth shape stays narrow: one current-session boundary plus sign-in/sign-out flows, not a broad account platform.
- Google provider mode can coexist with a development fallback path, but product persistence remains login-required either way.

## Account Lifecycle Decisions
- Soft delete is the active user-facing deletion path.
- Inactive users are blocked from authenticated-session reads.
- Grace-period recovery exists through sign-in.
- Final hard delete is an operations flow that removes the `users` row and relies on FK cascades.
- Gameplay data reset is a separate future scope from account deletion.

## Catalog And Form Scope
- Current item/move/form support is intentionally bounded.
- The present DB catalog plus limited query-time overrides are still considered sufficient for the current MVP.
- Broader form-aware learnset normalization remains deferred until wider runtime form legality becomes a real requirement.

## Read-Model And Normalization Rules
- If deeper normalization happens later, import scripts should absorb upstream shape drift.
- Repository helpers should absorb storage-model changes.
- Client payload contracts should remain stable unless the server can no longer preserve them.
- No broader normalization migration should start until supported form scope, read-model contracts, and import/backfill order are fixed.

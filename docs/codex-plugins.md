# Codex Plugins

## Local marketplace

This repository includes a repo-local Codex marketplace at `.agents/plugins/marketplace.json`.

Current local plugin:

- `kxoxxy-runtime-guard`

## kxoxxy-runtime-guard

Purpose:

- Reinforce the repository's hybrid runtime model before data-flow edits.
- Point agents to `docs/session-guide.md`, `docs/architecture.md`, `docs/verification-guide.md`, and `docs/database-plan.md` when those checks are relevant.
- Remind agents to keep `app/` thin, preserve server and client boundaries, and use the lightest valid verification.

How it works:

- The plugin manifest lives at `plugins/kxoxxy-runtime-guard/.codex-plugin/plugin.json`.
- The plugin exposes the `runtime-guard` skill from `plugins/kxoxxy-runtime-guard/skills/runtime-guard/SKILL.md`.
- The marketplace entry points Codex at `./plugins/kxoxxy-runtime-guard`.

Usage:

1. Start Codex in the repository root.
2. Open `/plugins`.
3. Browse the `Kxoxxy Local Plugins` marketplace.
4. Install `Kxoxxy Runtime Guard`.

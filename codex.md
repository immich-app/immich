Codex Operating Manual (codex.md)

Audience: The AI coding agent (you). This is your playbook for working inside the Immich monorepo using the Codex CLI.

Mission

- Deliver precise, minimal, and correct changes.
- Communicate succinctly and keep stakeholders oriented.
- Validate work locally with the smallest practical scope.

Golden Rules

- Always update `continue.md` with context, decisions, TODOs, and next steps after meaningful work. Treat it as your durable memory.
- Use clear preambles before grouped tool calls (1–2 sentences about what’s next).
- For non-trivial tasks, maintain an up-to-date plan via the plan tool and keep exactly one step in progress.
- Prefer repository standards and patterns over novel approaches.
- Do not commit changes or create branches unless explicitly asked; use patches in this environment.

Environment & Privileges

- Filesystem: Full access within the workspace.
- Network: Enabled — you may research and install packages when justified.
- Sudo: Allowed — you may run `sudo` and `sudo docker compose` when required.
- Docker: Available — use Docker/Compose for dev, prod, and e2e stacks.

Core Workflows

- Explore code:
  - Prefer `rg` for fast search; chunk reads up to ~250 lines.
  - Skim `Makefile`, `pnpm-workspace.yaml`, `mise.toml`, and package-level scripts.

- Setup & build (package-level):
  - Install: `pnpm --filter <pkg> install` (respect frozen lock where possible)
  - Build: `pnpm --filter <pkg> run build`
  - Check: `format`, `lint`, `check`, `test` as appropriate per package

- Dev stack (Docker):
  - Start: `make dev` (uses `docker/docker-compose.dev.yml`)
  - Stop: `make dev-down`

- E2E stack:
  - Start: `make e2e`
  - Tests: `pnpm --filter immich-e2e run test` and `test:web`

- OpenAPI regeneration:
  - Build server → `pnpm --filter immich build`
  - Sync → `pnpm --filter immich run sync:open-api`
  - Generate → `make open-api` or `make open-api-typescript`

Task Execution Pattern

1) Clarify scope: Restate the goal in one sentence.
2) Plan: Add 3–7 short steps with one `in_progress` via the plan tool.
3) Explore: Read relevant code with `rg` and targeted `sed -n` chunks.
4) Implement: Use `apply_patch` with minimal diffs. Don’t reformat unrelated code.
5) Validate: Run the smallest set of checks and tests that exercise the change.
6) Summarize: Report what changed, where, why, and how it was verified.
7) Memory: Update `continue.md` with decisions, commands, and next steps.

Messaging Style

- Concise and direct. Avoid filler.
- Use bullets and short paragraphs; include just-enough context.
- Reference files as inline code paths, optionally with line numbers (e.g., `server/src/app.module.ts:42`).

File References & Formatting

- Use backticks around commands, file paths, env vars, and identifiers.
- When referencing files, include a stand-alone path (e.g., `web/src/app.d.ts:10`).
- Avoid heavy formatting in responses; bullets are fine.

Safety & Boundaries

- Don’t change licenses or headers.
- Don’t introduce unrelated dependency upgrades.
- Don’t run destructive DB ops or remove volumes unless requested.
- If a change ripples across packages (API contract changes), coordinate: regenerate OpenAPI and update consumers.

When to Use Network/Sudo

- Installing missing system libs (e.g., `ffmpeg`, build deps for `sharp`) to unblock builds or tests.
- Pulling docker images and running compose (`sudo docker compose ...`).
- Researching niche errors; cite sources in summaries if you relied on external guidance.

Testing Philosophy

- Start narrow: run tests for the touched package.
- Expand if needed: related packages or e2e flows.
- Only run repo-wide `make check-all`/`make test-all` when warranted.

Common Commands Reference

- Monorepo install: `pnpm -r --filter '!documentation' install`
- Server checks: `pnpm --filter immich run check:all`
- Web checks: `pnpm --filter immich-web run check:all` (or `check:typescript`, `check:svelte`, `test`)
- E2E: `make e2e && pnpm --filter immich-e2e run test`
- OpenAPI: `make open-api` | TS only `make open-api-typescript`
- SQL sync: `make sql`

Memory Protocol (continue.md)

- Treat `continue.md` as the single source of truth for session continuity.
- After meaningful work, append:
  - Date/time, summary, files changed, key decisions
  - Commands run and their purpose
  - Open questions, TODOs, and next steps
  - Any environment assumptions or versions that matter
- On session start, read `continue.md` to reconstruct context and resume.


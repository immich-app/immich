# Immich — Agent Notes

Context for coding agents (Claude, etc.) working in this repository.

## Read this first

- `CONTRIBUTING.md` — **note the "Use of generative AI" section explicitly discourages LLM-generated PRs.** Treat agent-assisted work in this repo as exploratory/local-only unless a maintainer has clearly signed off on upstreaming it. Don't open a PR with agent-generated code without a human fully reviewing and understanding it first.
- `docs/docs/developer/architecture.mdx` — high-level system design (client/server, hexagonal-ish server layering: `src/controllers` → `src/services` → `src/repositories`).
- `docs/docs/developer/directories.md` — monorepo folder layout.
- `docs/docs/developer/setup.md`, `docs/docs/developer/testing.md`, `docs/docs/developer/database-migrations.md`, `docs/docs/developer/pr-checklist.md` — dev workflow docs. Written mise-first; see caveat below.

## Repo layout (most relevant folders)

- `server/` — NestJS/TypeScript backend (`immich-server` image). See `server/CLAUDE.md` for backend-specific conventions learned while working in this repo.
- `web/` — SvelteKit frontend.
- `mobile/` — Flutter app (Dart/iOS/Android).
- `docs/` — Docusaurus site; canonical developer + user documentation.
- `e2e/` — end-to-end tests (Vitest + supertest against a running server stack).
- `packages/sdk` — generated OpenAPI client SDK, packages/cli — CLI tool.

## Dev environment: prefer `pnpm` directly over `mise` tasks

The docs describe `mise` (`mise //server:test`, `mise dev`, `mise //server:migrations generate`, etc.) as the primary workflow, and `mise` tasks are what CI/the checklist docs reference. **In sandboxed or incomplete dev environments (e.g. many agent sandboxes, or the shipped devcontainer), a lot of `mise` tasks don't work** — this is even acknowledged in the docs themselves (`docs/docs/developer/pr-checklist.md`: "The provided devcontainer isn't complete at the moment. At least all dockerized steps in the Makefile won't work (`mise dev`, ....)").

When `mise` isn't cooperating, fall back to the underlying `pnpm` script directly from the relevant package directory (check that package's `package.json` `scripts` block for the authoritative list — don't guess names):

| Instead of                                     | Try                                                                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `mise //server:test`                            | `cd server && pnpm run test` (filter with `pnpm run test -- <pattern>`, e.g. `pnpm run test -- auth.service`)                              |
| `mise //server:migrations generate <name>`      | `cd server && DB_URL="postgres://postgres:postgres@database:5432/immich" pnpm run migrations:generate -- src/schema/migrations/<name>`     |
| `mise //server:migrations run`                  | `cd server && DB_URL="postgres://postgres:postgres@database:5432/immich" pnpm run migrations:run`                                          |
| `mise //server:migrations revert`                | `cd server && DB_URL="postgres://postgres:postgres@database:5432/immich" pnpm run migrations:revert`                                       |
| `mise //server:lint` / `format` / `check`       | `cd server && pnpm run lint` / `pnpm run format` / `pnpm run check` (exact script names may vary — check `package.json`)                   |
| `mise //:sql` (regenerate `server/src/queries/*.sql` snapshots) | `cd server && pnpm run build && DB_URL="postgres://postgres:postgres@database:5432/immich" node ./dist/bin/sync-sql.js`     |

Notes:
- Swap `database` for `localhost` (or whatever hostname is actually reachable) in `DB_URL` depending on where Postgres is running relative to the shell you're in.
- All of the above require a real reachable Postgres instance except unit tests (`pnpm run test`), which are fully mocked and don't need a DB.
- If a `pnpm run <script>` command also doesn't work, that's a real signal to stop and report it rather than assuming success — don't claim validation passed without having actually seen it pass.

## Active feature work

See `.claude/encrypted-locked-folder.md` for design notes and progress on making Immich's existing "Locked Folder" feature (asset visibility flag + PIN-code session unlock) actually encrypt assets at rest, via a per-user envelope-encrypted data key.

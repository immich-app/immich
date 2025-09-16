# Immich — Agent Continuity Log (continue.md)

This file captures durable context, decisions, and next steps so work can resume smoothly after restarts.

Last updated: 2025-09-16

Repository Map (high level)

- server — NestJS 11 API, Kysely + Postgres, Redis, BullMQ, Sharp, ffmpeg bindings
- web — Svelte 5/SvelteKit tooling, Vite 7, Tailwind 4
- cli — TypeScript CLI with Vite
- machine-learning — Python service (uv-managed), onnxruntime backends
- e2e — Vitest + Playwright, dockerized stack for tests
- open-api — Codegen for Dart (mobile) and TypeScript SDK
- docs — Docusaurus site
- docker — Compose files for dev/prod, env examples, hw accel overlays

Environment & Tooling

- Node 22.19.0, pnpm 10.14.0 (see `mise.toml`, `pnpm-workspace.yaml`)
- Python 3.10+ for ML with uv (`machine-learning/pyproject.toml`)
- Docker & Docker Compose available (use `sudo` as needed)
- Datastores: Postgres (custom image), Redis (Valkey)

Core Dev Workflows

- Install all (no docs): `pnpm -r --filter '!documentation' install`
- Dev stack (Docker):
  - Start: `make dev`
  - Stop: `make dev-down`
- OpenAPI:
  - Build server: `pnpm --filter immich build`
  - Sync spec: `pnpm --filter immich run sync:open-api`
  - Generate SDKs: `make open-api` or `make open-api-typescript`
- Tests:
  - Server: `pnpm --filter immich run test`
  - Web: `pnpm --filter immich-web run test`
  - CLI: `pnpm --filter @immich/cli run test`
  - E2E: `make e2e && pnpm --filter immich-e2e run test`

Key Files/Configs

- pnpm workspace: `pnpm-workspace.yaml`
- Make targets: `Makefile`
- Compose files: `docker/docker-compose.dev.yml`, `docker/docker-compose.yml`, `docker/docker-compose.prod.yml`
- Example env: `docker/example.env`
- OpenAPI generator script: `open-api/bin/generate-open-api.sh`

Session Log

- 2025-09-16 — Initialized project memory
  - Added `AGENTS.md` (project conventions), `codex.md` (agent playbook), and `continue.md` (this log)
  - Confirmed stack structure, build/test scripts, and compose files
  - No code changes to runtime packages yet

- 2025-09-16 — S3 storage RFC drafted
  - Added `design/s3-storage-rfc.md` outlining architecture, config, phases, and migration
  - Focus: pluggable backend, S3 URIs in DB, streaming via S3, staging for ffmpeg/sharp
  - No code integrations yet (backwards compatible)

- 2025-09-16 — Phase 0 scaffolding + isImmichPath
  - Added storage backend interfaces and stubs: `server/src/storage/app-storage.interface.ts`, `server/src/storage/local-backend.ts`, `server/src/storage/s3-backend.ts`
  - Enhanced `server/src/cores/storage.core.ts:124` to recognize `s3://` URIs in `isImmichPath`
  - Stubs are not wired; no behavior change aside from safer path detection when base is S3

Decisions & Assumptions

- Follow minimal-diff policy; generate OpenAPI only when API contracts change
- Validate within changed package first; expand to e2e if change is user-facing
- Use `sudo docker compose` when needed; avoid destructive operations by default

Open TODOs / Next Steps

- [ ] When first code change is requested, run package-level checks before submitting
- [ ] If API schema changes, regenerate OpenAPI and update `@immich/sdk` + consumers
- [ ] If web or server builds fail locally due to missing native deps, use `sudo apt-get install` to unblock, then log here
- [ ] Implement Phase 0 scaffolding for S3 backend (interfaces, stubs) without affecting builds
- [x] Implement Phase 0 scaffolding for S3 backend (interfaces, stubs)
- [ ] Extend env/config for S3 (engine + credentials) behind defaults
- [x] Update `StorageCore.isImmichPath` to support `s3://` URIs (safe, backward-compatible)
- [ ] Plan e2e MinIO stack to validate streaming and zip download from S3

Helpful Links

- Environment variables reference: https://immich.app/docs/install/environment-variables
- Install requirements: https://immich.app/docs/install/requirements
- Project overview: https://immich.app/docs/overview/introduction

Notes for Next Resume

- Start by scanning this file to recover context and pending TODOs
- Re-check Node/pnpm versions (`mise use`/Volta), then run the smallest verification needed for your task

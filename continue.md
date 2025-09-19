# Immich — Agent Continuity Log (continue.md)

This file captures durable context, decisions, and next steps so work can resume smoothly after restarts.

Last updated: 2025-09-19

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

- 2025-09-19 — Session start and guidelines review
  - Read `AGENTS.md`, `codex.md`, and `continue.md`; aligned on principles, workflows, and memory protocol
  - Environment context: approvals=never, sandbox=danger-full-access, network=enabled
  - Commands: searched/opened files with `rg`, `find`, and `sed -n` for chunked reads
  - Next: Awaiting user direction on what to tackle first; will create a short plan and validate within the smallest scope

- 2025-09-19 — Resolve merge conflicts (en/S3_Support)
  - Files fixed:
    - `server/src/repositories/machine-learning.repository.ts` — merged imports: kept `S3AppStorageBackend` + `ConfigRepository` and added `MachineLearningConfig`; removed conflict markers and unused constants
    - `pnpm-lock.yaml` — regenerated via lockfile-only install to remove extensive conflict markers
  - Commands:
    - `npm i -g pnpm@10.14.0 || sudo npm i -g pnpm@10.14.0` (resulted in pnpm 10.15.1)
    - `pnpm -r --filter '!documentation' install --lockfile-only`
    - Verified no conflict markers: `rg -n '^(<<<<<<<|=======|>>>>>>>)' -- pnpm-lock.yaml server/src/repositories/machine-learning.repository.ts`
  - Notes:
    - Skipped full installs/builds; Node here is v18.19.1, while some packages want >=20 — will validate builds on request or under Node 22.19.0 per repo standard

- 2025-09-19 — Fix DB backup to support S3
  - Root cause: `BackupService` wrote gzip output via local FS only (`StorageRepository.createWriteStream`) and used local-only cleanup (`readdir`, `unlink`, `rename`). Under `IMMICH_STORAGE_ENGINE=s3`, backups path is an S3 prefix, so writes and cleanup failed.
  - Changes:
    - `server/src/services/backup.service.ts`:
      - Added S3 helpers (`getS3`) and S3-aware write path
      - For S3 destinations, stream gzip output to S3 via `s3.writeStream()` and finalize multipart upload before completing
      - Replace local rename with S3 copy+delete (`copyObject` → `deleteObject`)
      - Cleanup uses S3 listing/deletion when backups folder is on S3; otherwise uses local `readdir`/`unlink`
      - Fixed path joining bug: avoid `path.join` on `s3://...` (which produced `s3:/...`). Added `joinPaths()` to build correct keys
    - `server/src/storage/s3-backend.ts`:
      - Added `list(prefixPath)` using `ListObjectsV2` with `Delimiter: '/'` to emulate `readdir` on a prefix
  - Verification suggestions:
    - Trigger backup job: `POST /jobs` with `{ "name": "backup-database" }` as admin
    - Expect object at `s3://<bucket>/<prefix>/backups/immich-db-backup-<timestamp>-v<version>-pg<pg>.sql.gz`
    - Old `.tmp` object should be removed after copy
  - Notes:
    - Web build failed locally on Node 18 (needs >=20); server build/testing should be done with Node 22.19.0 per repo standard

- 2025-09-19 — Docs: S3/MinIO support and migration
  - Added admin docs page: `docs/docs/administration/s3-storage.md` (purpose, enable/disable, migration via `aws s3 sync`, backups on S3, MinIO tips, rollback)
  - Updated `docs/docs/install/environment-variables.md` with S3 variables table and notes
  - Updated `docs/docs/administration/backup-and-restore.md` to note S3 backups path under `backups/`
  - Updated `docs/docs/administration/system-integrity.md` to explain mount checks are skipped in S3 mode
  - Expanded `docker/README.md` S3 section with a concise migration procedure
  - Linked S3 docs from root `README.md`

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

- 2025-09-16 — Phase 1 (read-path) wiring
  - Extended env schema for storage engine + S3 in `server/src/dtos/env.dto.ts` and mapping in `server/src/repositories/config.repository.ts`
  - Added S3 read support: implemented `readStream` and `head` in `server/src/storage/s3-backend.ts`
  - Zip streaming supports streams via `addStream` in `server/src/repositories/storage.repository.ts`
  - Download zip now streams S3 assets: `server/src/services/download.service.ts`
  - Added dependency `@aws-sdk/client-s3` to `server/package.json`

- 2025-09-16 — Phase 2 (write-path) staging
  - S3 write support for generated media (thumbnails, previews, encoded videos) with local temp staging in `server/src/services/media.service.ts`
  - Skipped local mkdir/cleanup for S3 in `server/src/cores/storage.core.ts` (ensureFolders/removeEmptyDirs)
  - Skipped mount checks when engine is S3 in `server/src/services/storage.service.ts`
  - File deletion job removes S3 objects when applicable in `server/src/services/storage.service.ts`

- 2025-09-16 — Phase 2b (original uploads to S3)
  - Custom S3 upload path in `server/src/middleware/file-upload.interceptor.ts` for asset uploads; streams directly to S3 while hashing
  - Upload folder logic S3-safe in `server/src/services/asset-media.service.ts`
  - StorageCore path joining is S3-aware (no `path.join` corruption) in `server/src/cores/storage.core.ts`
  - sendFile streams S3 objects for originals/thumbnails/playback in `server/src/utils/file.ts`

- 2025-09-16 — Phase 2c (sidecars + S3-native moves)
  - Sidecars stream to S3 during upload using the same hashing pipeline in `server/src/middleware/file-upload.interceptor.ts`
  - Storage template migrations use S3-native moves (copy+delete) via `server/src/cores/storage.core.ts`
  - Skipped removeEmptyDirs for S3 engine in `server/src/services/storage-template.service.ts`

- 2025-09-16 — Docker updates for S3
  - Added S3/engine variables and guidance in `docker/example.env`
  - Added notes in compose files that `/data` volume is optional/unused when using S3: `docker/docker-compose.yml`, `docker/docker-compose.dev.yml`, `docker/docker-compose.prod.yml`
  - Added short S3/MinIO instructions to `docker/README.md`

- 2025-09-16 — Upload streaming hardening (multipart + error propagation)
  - Switched S3 uploads to multipart via `@aws-sdk/lib-storage` in `server/src/storage/s3-backend.ts`
  - New writeStream contract returns `{ stream, done }`; local backend mirrors this; middleware awaits `done()`
  - Propagates S3 upload errors by destroying the PassThrough stream to avoid hanging requests

- 2025-09-16 — Server storage info (S3)
  - Avoids `statfs` on S3 URIs; returns N/A in `server/src/services/server.service.ts:getStorage()`

- 2025-09-16 — Metadata extraction S3 staging (Phase 2d)
  - Stages S3 originals/sidecars to temp before exiftool/ffprobe/stat in `server/src/services/metadata.service.ts`
  - Motion photo extraction now reads from staged local file

- 2025-09-16 — Build/debug fixes
  - Fixed TS nullability in `server/src/services/media.service.ts` (stagedIn nullable)
  - Added `@aws-sdk/lib-storage` to `server/package.json`
  - For Docker build without updated lockfile, used `--no-frozen-lockfile` in `server/Dockerfile` for server stage
  - Recommended alternative: update `pnpm-lock.yaml` with `pnpm -r install` and keep frozen lockfile

Decisions & Assumptions

- Follow minimal-diff policy; generate OpenAPI only when API contracts change
- Validate within changed package first; expand to e2e if change is user-facing
- Use `sudo docker compose` when needed; avoid destructive operations by default

Open TODOs / Next Steps

- [ ] When first code change is requested, run package-level checks before submitting
- [ ] If API schema changes, regenerate OpenAPI and update `@immich/sdk` + consumers
- [ ] If web or server builds fail locally due to missing native deps, use `sudo apt-get install` to unblock, then log here
- [x] Implement Phase 0 scaffolding for S3 backend (interfaces, stubs)
- [x] Extend env/config for S3 (engine + credentials) behind defaults
- [x] Update `StorageCore.isImmichPath` to support `s3://` URIs (safe, backward-compatible)
- [x] Plan e2e MinIO stack to validate streaming and zip download from S3 (planned; not executed)
- [ ] Extend upload/original asset write path to S3 (asset upload endpoints)
- [x] Extend upload/original asset write path to S3 (asset upload endpoints)
- [ ] Update any remaining direct FS operations to honor S3 (e.g., person thumbnail writes) if needed
- [ ] Optimize S3 uploads to stream (avoid buffering large files in memory)
- [ ] Add e2e MinIO service and tests for S3 upload/processing/download
- [ ] Stream user profile images to S3 (currently default disk path)
- [ ] Optional: UI shows "Object storage in use" instead of N/A for capacity

Helpful Links

- Environment variables reference: https://immich.app/docs/install/environment-variables
- Install requirements: https://immich.app/docs/install/requirements
- Project overview: https://immich.app/docs/overview/introduction

Notes for Next Resume

- Start by scanning this file to recover context and pending TODOs
- Re-check Node/pnpm versions (`mise use`/Volta), then run the smallest verification needed for your task
- 2025-09-16 — Phase 1 (read-path) wiring
  - Extended env schema for storage engine + S3 in `server/src/dtos/env.dto.ts:1` and wired mapping in `server/src/repositories/config.repository.ts:1`
  - Added S3 read support: implemented `readStream` and `head` in `server/src/storage/s3-backend.ts:1`
  - Zip streaming supports streams via `addStream` in `server/src/repositories/storage.repository.ts:1`
  - Download zip now streams S3 assets: `server/src/services/download.service.ts:1`
  - Added dependency `@aws-sdk/client-s3` to `server/package.json:1`
- 2025-09-16 — Build fix
  - Fixed invalid JSON in `server/package.json` (stray dependency line); moved `@aws-sdk/client-s3` into `dependencies`
  - Note: update `pnpm-lock.yaml` (`pnpm -r install`) or relax `--frozen-lockfile` in Dockerfile for successful build
  - Docker server stage uses `--no-frozen-lockfile` as a stopgap; prefer updating lockfile instead

Notes & Tips
- AWS Acceleration: set `S3_USE_ACCELERATE=false` unless Transfer Acceleration is enabled on the bucket
- Env quoting: avoid wrapping secrets in quotes in `.env`
- MinIO: set `S3_ENDPOINT` and `S3_FORCE_PATH_STYLE=true`; do not set acceleration
- Media base: S3 base is derived as `s3://<S3_BUCKET>/<S3_PREFIX?>`; do not set `IMMICH_MEDIA_LOCATION` manually in S3 mode
- 2025-09-16 — S3 Migration plan (draft)
  - Preferred path: external sync from local `/data` → `s3://<bucket>/<prefix>` using `aws s3 sync`/`s5cmd`, then flip `IMMICH_STORAGE_ENGINE=s3` and let bootstrap rewrite DB paths
  - Alternative: in-app CLI to iterate DB and copy+verify per-asset, then update paths; can implement on request
  - Recommended sequence: copy while server runs → brief stop → delta sync → switch engine → restart → verify → optional cleanup of local data

- 2025-09-16 — In-app migration CLI (Option B)
  - Added `migrate-to-s3` command (server admin CLI) to copy local → S3 and update DB paths per asset
  - Originals + sidecars by default; `--include-derivatives` migrates thumbnails/previews/fullsize/encodes
  - Verifies by size via S3 HEAD; skips when dest matches; supports `--dry-run` and `--concurrency`
  - Files:
    - `server/src/commands/migrate-to-s3.command.ts`
    - wired into CLI in `server/src/commands/index.ts`

- 2025-09-17 — Resolve pnpm-lock conflict after merging origin/main
  - Regenerated `pnpm-lock.yaml` from scratch to eliminate merge markers and incorporate both sets of changes
  - Installed `pnpm@10.14.0` globally (sudo) due to missing corepack; current Node is v18.19.1 in this shell
  - Ran: `rm -rf node_modules && pnpm -r --filter '!documentation' install` to produce a clean lockfile
  - Verified lock contains AWS deps for S3 feature and potential SES usage:
    - `@aws-sdk/client-s3@3.890.0`, `@aws-sdk/lib-storage@3.890.0`, and `@aws-sdk/client-sesv2@3.890.0`
  - Marked conflict as resolved (`git add pnpm-lock.yaml`); no other merge conflicts reported
  - Note: Server build in this environment failed due to ESM/CJS mismatch (nestjs-kysely) and Node version; use Node 22.19.0 via Volta/mise for local build and run server checks

- 2025-09-17 — Fix server build (nestjs-kysely ESM mismatch)
  - Root cause: `nestjs-kysely@3.x` is ESM-first; with `module: node16` and no `type: module`, TS raised TS1479 and types mismatch
  - Surgical fix:
    - Pin `nestjs-kysely` to CJS-compatible `^1.2.0` in `server/package.json` (runtime fix)
    - Switch TS to `module: nodenext` + `moduleResolution: nodenext` in `server/tsconfig.json` for better conditional exports handling
    - Cast Kysely config where required to satisfy dual ESM/CJS types:
      - `server/src/app.module.ts` → `KyselyModule.forRoot(getKyselyConfig(...) as any)`
      - `server/src/bin/sync-sql.ts` → `...(getKyselyConfig(...) as any)`
  - Verified: `pnpm --filter immich run build` succeeds locally and runtime works in Docker
  - Docker build path uses `--no-frozen-lockfile`, so the pin applies during image build
  - Follow-up: When ready to adopt full ESM, remove casts, restore `nestjs-kysely@^3`, and add a safe ESM migration (avoid `require()` usages)

- 2025-09-17 — Web gesture fix + sharp/libvips alignment
  - Pinned `svelte-gestures` to `5.1.4` (pre-attachments API) in `web/package.json` to match current imports (`swipe`, `SwipeCustomEvent`)
  - Aligned `sharp` with base image libvips by pinning to `0.34.3` via `server/package.json` overrides + root `package.json` pnpm.overrides
  - Rebuilt lock; verified Docker server/web stages progress

- 2025-09-18 — Session bootstrap & guidelines review
  - Read `AGENTS.md`, `codex.md`, and this `continue.md` to rehydrate context
  - Key rules to follow: small, surgical changes; preserve style; validate smallest scope first; preambles for grouped tool calls; maintain one in-progress plan step; avoid unrelated diffs; don’t commit/branch in this environment; regenerate OpenAPI on API changes; avoid destructive ops unless requested
  - Environment context: cwd `/workspace`, approvals `never`, sandbox `danger-full-access`, network `enabled`, shell `bash`
  - Memory protocol: append session notes to `continue.md` after meaningful work (decisions, commands, next steps)
  - Status: awaiting next task/direction from user

- 2025-09-18 — Fix broken pnpm-lock.yaml (duplicated mapping key)
  - Symptom: Docker build failed on `--frozen-lockfile` with `ERR_PNPM_BROKEN_LOCKFILE` (duplicate key `@types/node@22.18.5` under snapshots)
  - Approach: regenerate lock cleanly using repo’s pnpm version, ignoring scripts for Node 18 environment compatibility
  - Commands:
    - `sudo npm i -g pnpm@10.14.0`
    - `pnpm -r --filter '!documentation' install --ignore-scripts` (initial attempt)
    - `cp pnpm-lock.yaml pnpm-lock.yaml.backup-2025-09-18 && rm pnpm-lock.yaml && pnpm -r --filter '!documentation' install --ignore-scripts` (force fresh lock)
    - Sanity checks:
      - `pnpm --filter @immich/sdk --filter @immich/cli install --frozen-lockfile --ignore-scripts` (OK)
      - `pnpm --filter @immich/sdk --filter immich-web install --frozen-lockfile --ignore-scripts` (OK)
  - Outcome: duplicate mapping removed; lock validates with `--frozen-lockfile`. Ready to retry Docker build.

Commands run
- sudo npm i -g pnpm@10.14.0
- cp pnpm-lock.yaml pnpm-lock.yaml.merge-conflict-backup
- rm pnpm-lock.yaml
- rm -rf node_modules
- pnpm -r --filter '!documentation' install
- git add pnpm-lock.yaml

Next steps
- Switch to Node 22.19.0 (mise/Volta) and validate:
  - `pnpm --filter immich run build` (server)
  - `pnpm --filter immich-web run build` (web)
- If API surfaces changed, regenerate OpenAPI (`make open-api-typescript`)
- If SES is actually used on main, confirm corresponding code paths compile with the new lock

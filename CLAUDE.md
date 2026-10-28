# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

Immich is a self-hosted photo/video management platform. This is a pnpm + mise monorepo:

| Directory | What it is | Stack |
| --- | --- | --- |
| `server/` | REST API + background job workers (package `immich`) | NestJS, Express, Kysely, PostgreSQL, BullMQ/Redis |
| `web/` | Web app (package `immich-web`), built as an SPA and served by the server | SvelteKit, Svelte 5 runes, Tailwind, `@immich/ui`, tanstack query |
| `mobile/` | Android/iOS app | Flutter, Riverpod, Drift, auto_route, pigeon |
| `native/` | Rust core compiled into the mobile app | Cargo workspace, ffigen bindings |
| `machine-learning/` | CLIP / face / OCR inference service | Python 3.12, FastAPI, ONNX Runtime, uv |
| `e2e/` | API (vitest) and browser (Playwright) end-to-end tests against a Docker stack | |
| `packages/sdk` | `@immich/sdk`, TypeScript client generated from the OpenAPI spec | |
| `packages/cli` | `@immich/cli` bulk-upload tool | |
| `packages/plugin-sdk`, `packages/plugin-core` | Extism WASM plugin SDK and the built-in workflow plugin | |
| `packages/scripts` | Release and release-notes tooling | |
| `open-api/` | `immich-openapi-specs.json` (generated, never hand-edit) plus Dart generator templates/patches | |
| `i18n/` | Translation JSON for web and mobile. Only edit `en.json`; other locales come from Weblate | |
| `docs/` | Docusaurus site; developer docs in `docs/docs/developer/` | |

Tool versions (node, pnpm, flutter, rust, python, java, ffmpeg) are pinned in `mise.toml` files. Run `mise trust && mise install` once, then `mise x -- pnpm i`. Tasks are invoked as `mise //<dir>:<task>` from anywhere in the repo (`mise tasks ls --all` lists them). Each `<dir>/mise.toml` defines its tasks; most wrap the `pnpm run` scripts in that package.

## Common commands

### Full dev stack
```bash
cp docker/example.env docker/.env   # set UPLOAD_LOCATION
mise dev                             # server + web + ML + postgres + redis with hot reload, web on :3000
mise //web:start                     # web only, proxied to IMMICH_SERVER_URL (default http://immich-server:2283)
IMMICH_SERVER_URL=https://demo.immich.app/ mise //web:start   # or: mise //web:start-demo
```

### Server (`server/`)
```bash
pnpm test                       # unit tests (src/**/*.spec.ts)
pnpm test src/services/album.service.spec.ts     # single file
pnpm test:medium                # test/medium/**: boots Postgres via testcontainers (needs Docker)
pnpm lint && pnpm format && pnpm check           # eslint --max-warnings 0, prettier, tsc --noEmit
pnpm check:code                 # format + lint + check
mise //server:checklist         # everything CI runs, incl. medium tests and migrations verify-order
pnpm build                      # nest build -> dist/ (required before sync-sql / sync-open-api / migrations)
pnpm migrations:generate <Name> # diff src/schema against DB_URL (default postgres://postgres:postgres@localhost:5432/immich)
pnpm migrations:sync-order      # update src/schema/migrations/ORDER after adding a migration
pnpm schema:reset               # drop public schema and re-run all migrations
mise sql                        # regenerate src/queries/*.sql from @GenerateSql decorators (needs built dist + DB)
```

### Web (`web/`)
```bash
pnpm dev
pnpm test                       # vitest (happy-dom); pnpm test -- --run src/lib/utils/date-time.spec.ts for one file
pnpm lint && pnpm format && pnpm check:svelte && pnpm check:typescript
pnpm check:code                 # all of the above
mise //web:checklist
```
Web depends on the workspace `@immich/sdk`; build it first with `mise //:sdk:install && mise //:sdk:build` (the `//web:start` task does this).

### OpenAPI / SDK regeneration
```bash
mise open-api                   # build plugins + server, write open-api/immich-openapi-specs.json,
                                # regenerate packages/sdk/src/fetch-client.ts (oazapfts) and mobile/generated/openapi (Dart)
```
Run this after any controller/DTO change. CI job "OpenAPI Clients" fails if the spec or `packages/sdk` is stale; "SQL Schema Checks" fails if a migration is missing or `server/src/queries` is stale.

### Mobile (`mobile/`)
```bash
mise //mobile:checkout          # install + codegen; run after every branch switch
mise //mobile:codegen           # build_runner, drift, pigeon, ffigen, openapi, translations
mise //mobile:lint              # dart analyze --fatal-infos + dcm analyze
mise //mobile:format
mise //mobile:test              # flutter test; single: cd mobile && flutter test test/path/foo_test.dart
mise //mobile:translation       # regenerate after editing i18n/en.json
```
All generated Dart (`*.g.dart`, `*.drift.dart`, `*.freezed.dart`, `router.gr.dart`, `lib/generated/`, `lib/platform/*.g.dart`, `mobile/generated/openapi`) is git-ignored.

### Machine learning (`machine-learning/`)
```bash
uv sync --extra cpu
mise //machine-learning:lint | format | check | test     # ruff, ruff format, mypy --strict, pytest
cd machine-learning && uv run pytest test_main.py -k TestCache   # single test class
```

### Native (`native/`)
```bash
mise //native:build | test | lint | fmt     # cargo; clippy runs with -D warnings
```

### E2E (`e2e/`)
```bash
mise //e2e:ci-setup             # once: builds sdk + cli, installs e2e deps
mise //:open-api                # once
mise e2e                        # start the test stack (server on :2285)
mise //e2e:test                 # vitest API specs (src/specs/server/**)
pnpm test:web | test:web:ui | test:web:maintenance        # Playwright projects
pnpm exec vitest --run src/specs/server/api/album.e2e-spec.ts
pnpm exec playwright test --project=web src/specs/web/album.e2e-spec.ts
```
`e2e/test-assets` is a git submodule. Set `VITEST_DISABLE_DOCKER_SETUP=true` / `PLAYWRIGHT_DISABLE_WEBSERVER=1` to reuse a running stack.

### i18n
Root `pnpm format:fix` sorts and formats `i18n/*.json`; CI job "Test i18n" fails if it changes anything, so keep `en.json` key-sorted.

## Server architecture

**Processes.** `src/main.ts` is a supervisor that forks an `api` worker (HTTP) and starts a `microservices` worker thread (BullMQ job consumers), controlled by `IMMICH_WORKERS_INCLUDE/EXCLUDE`. If maintenance mode is set in `system_metadata`, only the `maintenance` worker boots (`src/maintenance/`). `main.ts immich-admin` runs nest-commander CLI commands from `src/commands/`.

**Layering (hexagonal).** `controllers` → `services` → `repositories`.
- Controllers are thin: `@Authenticated(...)`, `@Endpoint({ summary, description, history })`, call one service method with `(auth, dto)`.
- Every service `extends BaseService` (`src/services/base.service.ts`), whose constructor injects every repository as a `protected` field. Services normally declare no constructor. Adding a repository means updating `BaseService` constructor + `BaseService.create()` + `BASE_SERVICE_DEPENDENCIES`, `repositories/index.ts`, and `newTestService`/`getMocks` in `test/utils.ts`. `BaseService.create(OtherService, this)` builds a sibling service sharing the same repository instances.
- Repositories are the only layer doing I/O. Kysely repos inject `@InjectKysely() db: Kysely<DB>`; non-DB repos wrap fs (`StorageRepository`), sharp/ffmpeg (`MediaRepository`), BullMQ (`JobRepository`), env (`ConfigRepository`), etc. Repositories return rows; services interpret them and throw `BadRequestException` etc.
- Both `ApiModule` and `MicroservicesModule` (`src/app.module.ts`) extend `BaseModule`, which registers all repositories/services and emits `AppBootstrap`. Startup ordering uses `BootstrapEventPriority` in `src/enum.ts` (migrations → storage → jobs → system config → plugin sync/load).

**Imports.** ESM. Relative imports are banned by lint; always write `src/...js` or `test/...js`.

**DTOs & OpenAPI.** DTOs are Zod schemas via `nestjs-zod` (`createZodDto`, `.describe()`, `.meta({ id })`) in `src/dtos/`, alongside `mapX()` mapper functions. A global `ZodValidationPipe`/`ZodSerializerInterceptor` applies them. `HistoryBuilder` (`src/decorators.ts`) records endpoint version history (`.added('v1').beta(...).stable(...)`) into `x-immich-*` extensions. `src/bin/sync-open-api.ts` boots `ApiModule` and writes the spec; everything downstream (`@immich/sdk`, Dart client) is generated from it.

**Auth & access.** The global `AuthGuard` (`src/middleware/auth.guard.ts`) throws if a route lacks `@Authenticated()`. `AuthService.authenticate` resolves shared-link key/slug → session token → API key into an `AuthDto` (read with `@Auth()`). Resource-level checks happen in services: `await this.requireAccess({ auth, permission: Permission.AlbumUpdate, ids })`, implemented by `src/utils/access.ts` switching over `Permission` and delegating to `AccessRepository`'s nested checkers (`access.album`, `access.asset`, ...), which take ID sets and return the allowed subset. Call `requireAccess` first in a service method.

**Database.** `src/schema/tables/*.table.ts` are the source of truth, declared with `@immich/sql-tools` decorators (`@Table`, `@Column`, `@ForeignKeyColumn`, ...) plus Immich-specific ones in `src/decorators.ts` (`UpdatedAtTrigger`, `UpdateIdColumn`, `PrimaryGeneratedUuidV7Column`). `src/schema/functions.ts` and `enums.ts` register SQL functions/triggers (mostly `*_audit` triggers feeding sync) and PG enums. `src/schema/index.ts` lists tables in `ImmichDatabase` and maps snake_case table names to classes in the Kysely `DB` interface; a new table goes in both. `migrations:generate` diffs decorators against a live DB and emits `src/schema/migrations/<timestamp>-<Name>.ts`; `ORDER` is an append-only manifest (`sync-order` / `verify-order`). Migrations run automatically on boot unless `DB_SKIP_MIGRATIONS` is set. Repository methods decorated with `@GenerateSql({ params: [DummyValue.UUID] })` (often with `@ChunkedArray`/`@ChunkedSet`, which split lists at the PG bind-parameter limit) have their SQL snapshotted into committed `src/queries/*.sql` by `mise sql`.

**Jobs & events.** `JobName`, `QueueName`, `Permission`, `ImmichWorker` live in `src/enum.ts`; `JobItem`/`JobOf<>` unions in `src/types.ts`. A service method handles a job with `@OnJob({ name, queue })`; startup fails if any `JobName` has zero or multiple handlers. `JobService.onJobRun` wraps execution (`JobStart` → run → `JobSuccess`/`JobError` → `JobComplete`) and `onDone` holds hard-coded follow-up chaining (e.g. metadata → thumbnails → smart search). `@OnEvent({ name, priority?, workers?, server? })` subscribes to typed in-process events from `EventMap` in `src/repositories/event.repository.ts` (`AppBootstrap`, `ConfigUpdate`, `AssetCreate`, ...); `server: true` also receives cross-process socket.io events. `WebsocketRepository.clientSend/clientBroadcast` push to browsers/mobile.

**Config.** Admin-editable `SystemConfig`, its Zod schema and `defaults` are in `src/dtos/config.dto.ts`; load/save in `src/utils/config.ts` stores only the diff from defaults in `system_metadata`. `IMMICH_CONFIG_FILE` (JSON/YAML) makes config read-only. Env parsing is `src/repositories/config.repository.ts` with schema `src/dtos/env.dto.ts`. Services get config via `this.getConfig({ withCache })` and react with `@OnEvent` `ConfigInit/ConfigUpdate/ConfigValidate`.

**Plugins/workflows.** `src/services/workflow-execution.service.ts` (microservices only) imports plugin folders (`manifest.json` + wasm, validated by `src/dtos/plugin-manifest.dto.ts`), loads them with `@extism/extism`, exposes host functions (album/tag/http) that call real services via `BaseService.create`, and runs workflows triggered by asset events as `JobName.WorkflowAssetTrigger`. `packages/plugin-core` is the built-in plugin (TS → `dist/plugin.wasm` via `extism-js`); `mise //:plugins` builds it and is a prerequisite for server CI, medium tests and `mise dev`.

**Testing tiers.**
- Unit: `src/**/*.spec.ts`. `const { sut, mocks } = newTestService(AlbumService)` (`test/utils.ts`) auto-mocks every repository; strict mocks fail when called without an implementation. Fixtures in `test/fixtures/*.stub.ts`, builders in `test/small.factory.ts` (`factory.auth()`, ...) and `test/factories/`.
- Controller specs: `controllerSetup(Controller, [{ provide: Service, useValue: mockBaseService(Service) }])` boots Nest with the real validation pipe and `AuthGuard`, tested with supertest; they mainly cover validation and auth wiring.
- Medium: `test/medium/specs/**`. `globalSetup` starts `ghcr.io/immich-app/postgres` via testcontainers, migrates a template DB, and each file clones it. `newMediumService(Service, { database, real: [...], mock: [...] })` (`test/medium.factory.ts`) returns `{ sut, ctx }` with `ctx.newUser()`, `ctx.newAsset()`, `ctx.get(Repo)`.

## Web architecture

**App shell.** SSR is off (`src/routes/+layout.ts` sets `ssr = false`); the build is a static SPA (`adapter-static`, `fallback: index.html`). Root `+layout.ts` runs the memoized `init(fetch)` in `src/lib/utils/client.ts` (calls the SDK's `setFetch`, loads language, preloads server config, `authManager.load()`, feature flags, maintenance redirects). Root `+layout.svelte` provides `QueryClientProvider` and `@immich/ui` providers and manages the websocket. Vite dev proxies `/api`, `/.well-known/*`, `/custom.css` to `IMMICH_SERVER_URL`.

**Routes.** `src/routes/(user)/` is the authenticated app; its `+layout.ts` calls `authenticate(url, { public: isSharedLinkRoute(route.id) })`. `admin/+layout.ts` uses `authenticate(url, { admin: true })`. A typical `+page.ts`:
```ts
await authenticate(url);
await queryClient.query(getAlbumsQuery());
const $t = await getFormatter();
return { meta: { title: $t('albums') } };
```
Build URLs through the typed `Route` object in `src/lib/route.ts`, never by hand. Lint requires `continue`/`previousRoute` query params to go through `Route.continue(...)`.

**Imports.** Use the `#lib/*` subpath alias (also `#i18n/*`, `#test-data/*`, `#tests/*`) with explicit `.ts` extensions, e.g. `import { authManager } from '#lib/managers/auth-manager.svelte.ts'`. `$lib` is not used.

**State.** Svelte 5 runes throughout. Global state lives in `*.svelte.ts` singleton manager classes in `src/lib/managers/` (`authManager`, `eventManager`, `featureFlagsManager`, `uploadManager`, `timeline-manager/`, ...). `eventManager` is a typed app-wide bus (`AuthLogout`, `AssetUpdate`, ...); managers subscribe with `eventManager.on({...})`, components via `components/OnEvents.svelte`. `src/lib/stores/` holds older writable/persisted stores.

**Server data (tanstack query).** `src/lib/queries/client.ts` defines a single `queryClient` (`retry: false`, `staleTime: Infinity`) whose global `MutationCache` shows toasts from `meta.success.toast` / `meta.error.toast` and calls `handleError`. One `*.query.ts` per API controller exports a query-key constant, `getXQuery(...)` factories returning `queryOptions({ queryKey, queryFn: ({ signal }) => sdkFn(..., { signal }), select })`, and `xMutation` options (cache updates and events happen there). Helpers: `asMutation(sdkFn, options)`, `executeMutation(optionsFn, variables, mutateOptions)` for imperative mutations outside components, `createPreloadedQuery(() => opts)` for components reading data a loader already fetched, `readPreloadedQuery`. On `AuthLogout` all queries except server/public config are removed.

**Services vs modals.** `src/lib/services/*.service.ts` return `@immich/ui` `ActionItem`s (title, icon, `onAction`) built from a `$t` formatter; they open modals and run `executeMutation`. Modals are `src/lib/modals/*Modal.svelte` with `Props = { onClose: (result?) => void }`, opened with `const result = await modalManager.show(Component, props)` from `@immich/ui`. Toasts use `toastManager`.

**i18n.** `import { t } from 'svelte-i18n'` then `$t('key')` in components; `const $t = await getFormatter()` (`#lib/utils/i18n.ts`) elsewhere. Keys are typed against `i18n/en.json` via `src/app.d.ts`, so unknown keys fail `tsc`/`svelte-check`. Locales load lazily through the `langs` list in `src/lib/constants.ts`; `src/lib/i18n.spec.ts` checks every `i18n/*.json` has a loader. Rich text uses `src/lib/elements/FormatMessage.svelte`.

**Timeline.** `TimelineManager` extends the generic `VirtualScrollManager`; it holds `TimelineMonth` → `TimelineDay` → `ViewerAsset`. Month summaries come from the server's time buckets; assets load per month based on viewport proximity (`internal/intersection-support`, `load-support`), heights are estimated until laid out with the justified-layout WASM (`internal/layout-support`), and websocket/event updates upsert or move assets between months. UI is in `src/lib/components/timeline/`.

**Testing/lint.** Vitest config is the `test` block in `vite.config.ts` (happy-dom, setup `src/test-data/setup.ts`, which initializes svelte-i18n so `$t` returns keys). Factories in `src/test-data/factories/`, shared mocks in `src/lib/__mocks__/`. ESLint: type-aware typescript-eslint (`no-floating-promises`, `require-await`, `switch-exhaustiveness-check`), unicorn, `better-tailwindcss`, `compat`/`tscompat` against `.browserslistrc`; unused vars must be named exactly `_`. `svelte-check` runs with `--fail-on-warnings` (only `state_referenced_locally` ignored).

## Mobile architecture

Newer code follows `lib/domain/` (models, services, utils; must not depend on presentation or infrastructure) → `lib/infrastructure/repositories/` (Drift-backed) → `lib/presentation/` (pages, widgets, actions), wired by Riverpod providers in `lib/providers/`. The newest layer is `lib/data/`: the Drift schema/DB (`lib/data/db/main/` with `database.dart`, `dao/`, `query/`, `table/`), server API base (`lib/data/server/`) and store; new data access goes there and repos migrate one entity at a time. Legacy code remains in top-level `lib/pages`, `lib/widgets`, `lib/services`, `lib/repositories`, `lib/entities`. Drift schema snapshots live in `drift_schemas/main/`, with migration tests in `test/drift/main/`. Platform channels are pigeon definitions in `pigeon/*.dart` generating `lib/platform/*.g.dart` plus Swift/Kotlin. Shared design-system widgets are in `mobile/packages/ui/`. The Rust core (`native/`) is compiled from source during the Flutter build via `native/native_core/hook/build.dart`; bindings regenerate with `mise //mobile:codegen:native`.

`analysis_options.yaml` enforces `always_use_package_imports`, `require_trailing_commas`, `unawaited_futures`, `discarded_futures`, `prefer_final_locals`, page width 120. CI "Run Dart Code Analysis" also runs DCM unused-code checks (`mise //mobile:analyze --full`). Any newly required OpenAPI field needs a Dart backward-compatibility patch in `open-api/patch`, checked by `flutter test test/openapi_patches_coverage.dart`.

## Machine learning architecture

`immich_ml/main.py` is the FastAPI app (`/predict`, `/ping`), with model preload and idle shutdown. `pipeline.py` composes Clip, FacialRecognition and Ocr; models live in `models/{clip,facial_recognition,ocr}/` extending `models/base.py` `InferenceModel` (downloads via HF `snapshot_download`), and `models/cache.py` `ModelCache` keys by (class, name, graph) with TTL eviction (preloaded models stay). Execution backends are in `sessions/` (`ort.py`, `rknn/`, `ann/`). Tests are in a single `test_main.py`. Ruff line length 120, mypy strict.

## Contribution conventions

- PR titles must be conventional commits; PRs need a release label. Keep PRs to one focused change.
- Feature freezes: sharing/asset ownership and (external) libraries accept only minor bug fixes.
- Renaming or removing a docs page requires updating `docs/static/_redirects` (see `docs/`).
- Reviewers per directory are listed in `CODEOWNERS`.

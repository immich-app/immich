# e2e/AGENTS.md

End-to-end tests against a real Immich stack from `docker-compose.yml` (server on port 2285): API specs with vitest, browser specs with Playwright.

## Rules

- `test-assets/` is a git submodule; initialize it before running exif or upload specs.
- One-time setup: `mise //e2e:ci-setup` (builds the SDK and CLI) and `mise //:open-api`.
- Use the shared helpers in `src/utils.ts` (`utils.adminSetup`, `utils.userSetup`, `utils.resetDatabase`, `utils.createAsset`, `utils.waitForQueueFinish`, `asBearerAuth`, `asKeyAuth`, `immichCli`) instead of re-implementing login or fixtures.

## Skills

- **Run API specs**: `src/specs/server/**/*.e2e-spec.ts`, run with `mise //e2e:test`. If nothing answers at `127.0.0.1:2285`, the vitest `globalSetup` starts the Docker stack itself; set `VITEST_DISABLE_DOCKER_SETUP=true` to reuse a running one. One file: `pnpm exec vitest --run src/specs/server/api/album.e2e-spec.ts`. Maintenance-mode specs use `pnpm test:maintenance`.
- **Run browser specs**: Playwright projects are `web` (`src/specs/web/`, real backend), `maintenance` (`src/specs/maintenance/`), and `ui` (`src/ui/specs/`, mocked network from `src/ui/mock-network/`). Run with `pnpm test:web`, `pnpm test:web:maintenance`, `pnpm test:web:ui`, or `pnpm start:web` for the Playwright UI. Set `PLAYWRIGHT_DISABLE_WEBSERVER=1` to reuse a running stack. One file: `pnpm exec playwright test --project=web src/specs/web/album.e2e-spec.ts`.
- **Write an API spec**: in `beforeAll` call `await utils.resetDatabase()` and `admin = await utils.adminSetup()`, create users with `utils.userSetup(admin.accessToken, dto)`, and call the server through `@immich/sdk` functions with `asBearerAuth(token)` or through `supertest` on `app` for raw status-code and validation checks. After uploads, `await utils.waitForQueueFinish(admin.accessToken, 'thumbnailGeneration')` before asserting on derived data.

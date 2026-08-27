# Server (`server/`) — Agent Notes

NestJS/TypeScript backend for the `immich-server` image. See `docs/docs/developer/architecture.mdx` for the
high-level design (hexagonal-ish layering: `src/controllers` → `src/services` → `src/repositories`).

## Conventions learned while working in this codebase

- **Schema columns are strictly camelCase.** Both the TS property name in `src/schema/tables/*.table.ts` and the
  resulting Postgres column name — the `@Column` decorator does not transform casing (verified: zero snake_case
  columns exist anywhere under `src/schema/tables/*.ts`). Never introduce `snake_case` column/property names.
- **Migrations** live in `src/schema/migrations/*.ts`, named `<timestamp>-<PascalCaseDescription>.ts`, with
  hand-written `up`/`down` functions using Kysely's `sql` template tag for simple column add/drop changes. They're
  normally generated via `pnpm run migrations:generate -- src/schema/migrations/<name>` against a real Postgres
  instance (needs `DB_URL`, see root `CLAUDE.md`), but simple migrations can be hand-written directly, matching the
  style of existing files, when a DB isn't reachable in the current sandbox. Prefer editing a migration in place
  (rather than adding a follow-up migration) only if it is still local/unmerged — ask before assuming that's safe.
- **Sensitive columns are selected opt-in.** Repository query methods (`src/repositories/*.repository.ts`) that
  select sensitive columns (e.g. `password`) gate that behind an explicit options flag rather than selecting them
  by default, e.g. `userRepository.getByEmail(email, { withPassword: true })`. Follow this pattern for any other
  sensitive/secret columns (e.g. wrapped key material).
- **SQL snapshots.** `@GenerateSql(...)`-decorated repository methods have their generated query text snapshotted
  into `src/queries/*.sql` by `src/bin/sync-sql.ts`. Regenerate via:
  `pnpm run build && DB_URL="postgres://postgres:postgres@database:5432/immich" node ./dist/bin/sync-sql.js`
  (or `mise //:sql`, DB required). CI fails if these files are stale — regenerate them after changing any
  `@GenerateSql`-decorated query, including changing which columns it selects.
- **`BaseService`** (`src/services/base.service.ts`) injects every repository (`this.userRepository`,
  `this.cryptoRepository`, etc.) into every service that extends it. Adding a new repository means registering it
  in `BASE_SERVICE_DEPENDENCIES` and the constructor param list there too.
- **Unit test mocks.** `test/utils.ts`'s `newTestService(Service)` builds a mock of every repository. Most are
  auto-mocked via `automock()` (reflects the class prototype at runtime), but a handful — including
  `CryptoRepository` — have **hand-written** mock factories in `test/repositories/*.repository.mock.ts`.
  **Any new method added to one of those hand-mocked repositories must be added to its corresponding
  `test/repositories/*.repository.mock.ts` file too**, or tests fail at runtime with `<method> is not a function`
  even though the real class compiles fine (TypeScript won't catch this ahead of time in all cases).
- Run a single spec file with vitest directly (the `pnpm run test -- <pattern>` form does **not** reliably
  filter to one file in this repo's config — it still collects/runs the whole suite):
  `pnpm exec vitest run --config test/vitest.config.mjs <path-to-spec>`, e.g.
  `pnpm exec vitest run --config test/vitest.config.mjs src/services/auth.service.spec.ts`.

## Active feature work: encrypted-at-rest "Locked Folder"

See `../.claude/encrypted-locked-folder.md` for the full design/progress notes. Quick pointers:

- Auth/session endpoints: `src/controllers/auth.controller.ts` (`login`, `change-password`, `pin-code`,
  `session/unlock`, `session/lock`), backed by `src/services/auth.service.ts`.
- Locked Folder today is `AssetVisibility.Locked` (`src/enum.ts`) plus a PIN code stored on the user and a
  temporary "unlocked session" (`session.pinExpiresAt` / `auth.session.hasElevatedPermission`), **plus real
  encryption at rest for the original file** (not thumbnails/preview/video derivatives — see the design doc).
- Implemented: a per-user DEK, wrapped by a password-derived KEK (`user.wrappedDek`/`kekSalt`/`kekNonce`), and
  re-wrapped per-session under a key derived from that session's own raw access token
  (`session.wrappedDek`/`dekNonce`) so an active session can use the DEK without re-prompting for the password
  or PIN. The PIN itself stays a pure visibility/authorization gate, unchanged. `changePassword()` correctly
  re-wraps the user-level DEK under the new password. Additionally: `AssetService.updateAll()` encrypts an
  asset's `originalPath` in place (AES-256-GCM, streamed) the moment it's moved into the Locked Folder, using
  the *requesting session's* DEK — background job processors never see the DEK at all, which is why encryption
  happens at lock-time rather than upload-time (see "The background-job DEK problem" in the design doc).
  `AssetMediaService.downloadOriginal()` decrypts on the fly for supported sessions; `MediaService`/
  `MetadataService` reprocessing jobs (`handleGenerateThumbnails`/`handleVideoConversion`/
  `handleMetadataExtraction`) skip encrypted originals rather than crashing on ciphertext.
- Not yet implemented: encrypting thumbnail/preview/fullsize/transcoded-video derivative files (only the
  original is encrypted), bulk zip download support for encrypted assets (currently skipped, single-asset
  download is the supported path), and a documented-but-unresolved gap for OAuth-only users (no password → no
  DEK at all, ever). See the TODO list in `../.claude/encrypted-locked-folder.md` for the full, current state.

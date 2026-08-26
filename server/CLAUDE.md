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
- Run a single spec file/pattern with `pnpm run test -- <pattern>` (vitest), e.g. `pnpm run test -- auth.service`.

## Active feature work: encrypted-at-rest "Locked Folder"

See `../.claude/encrypted-locked-folder.md` for the full design/progress notes. Quick pointers:

- Auth/session endpoints: `src/controllers/auth.controller.ts` (`login`, `change-password`, `pin-code`,
  `session/unlock`, `session/lock`), backed by `src/services/auth.service.ts`.
- Locked Folder today is just `AssetVisibility.Locked` (`src/enum.ts`) plus a PIN code stored on the user and a
  temporary "unlocked session" — it does **not** currently encrypt anything at rest. That's the gap this feature
  work is closing.

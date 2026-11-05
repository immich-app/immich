# mobile/AGENTS.md

Flutter app with Riverpod, Drift (SQLite), auto_route, pigeon and a Rust core in `../native/`.

## Rules

- Run `mise //mobile:checkout` after switching branches. All generated Dart is git-ignored; never edit it.
- New code follows `lib/domain/` (models, services, utils; no dependency on presentation or infrastructure) → `lib/infrastructure/repositories/` → `lib/presentation/`, wired by providers in `lib/providers/`. New data access goes in `lib/data/` (`lib/data/db/main/` holds the Drift database, `dao/`, `query/`, `table/`; `lib/data/server/` the API base).
- Top-level `lib/pages`, `lib/widgets`, `lib/services`, `lib/repositories`, `lib/entities` are legacy; do not add to them.
- Shared design-system widgets live in `packages/ui/` (`immich_ui`), with a preview per component in `lib/src/previews/`.

## Skills

- **Run codegen**: `mise //mobile:codegen` runs the Dart OpenAPI client, build_runner (`*.g.dart`, `*.freezed.dart`, `router.gr.dart`), Drift migrations and schema, ffigen, pigeon and translations. Run it after changing Drift tables, routes, pigeon definitions or freezed classes; `mise //mobile:codegen:watch` keeps build_runner running. CI job "Unit Test Mobile" regenerates and fails if the code does not compile.
- **Change the local database**: edit tables in `lib/data/db/main/table/` and the `@DriftDatabase` in `lib/data/db/main/database.dart`, bump the schema version, then `mise //mobile:codegen:drift:migration` writes `database.steps.dart` and a snapshot in `drift_schemas/main/`. Add a step migration and a test in `test/drift/main/`.
- **Add a platform channel**: define the API in `pigeon/<name>.dart`, run `mise //mobile:codegen:pigeon` to generate `lib/platform/<name>.g.dart` plus the Swift and Kotlin interfaces, then implement them in `ios/` and `android/`.
- **Tests and lint**: `mise //mobile:test`; one file with `flutter test test/path/foo_test.dart`. Tests live under `test/{unit,medium,domain,infrastructure,drift,presentation}/`; `test/medium/` has `repository_context.dart` and `service_context.dart` for tests against a real Drift database. `mise //mobile:lint` runs the analyzer and DCM; `mise //mobile:lint-fix` fixes what it can.
- **Preview a UI component**: `cd packages/ui && flutter widget-preview start` shows components from `lib/src/previews/` with a light/dark toggle.

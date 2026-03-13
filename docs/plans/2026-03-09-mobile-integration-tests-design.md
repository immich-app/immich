# Mobile Integration Test Framework Design

## Overview

Add a Patrol-based E2E integration test framework for the Immich mobile app. Tests run against a local Docker backend (Immich server, DB, Redis, ML) and execute on an Android emulator. A small smoke suite gates PRs; a larger regression suite runs nightly.

## Framework Choice: Patrol

Patrol was chosen over Maestro and stock `integration_test` for these reasons:

- **Native interaction**: Immich requires photo permissions, background upload, notifications, biometric auth. Stock `integration_test` can't handle these; Patrol wraps UIAutomator (Android) and XCUITest (iOS).
- **Dart-native**: Tests written in Dart, same as the app. Reuse existing fixtures, page objects, and test utilities.
- **Incremental migration**: Patrol builds on `integration_test` — existing login tests can be migrated without a rewrite.
- **Gray-box testing**: Access to Flutter widget tree (`find.byKey()`, state inspection) alongside native automation.

Alternatives considered:

- **Maestro**: YAML-based, framework-agnostic, simpler setup. But black-box only, can't inspect Flutter state, tests in a different language from the codebase.
- **Stock `integration_test`**: Zero dependencies but can't interact with native OS dialogs — a dealbreaker for Immich's permission-heavy flows.

## Project Structure

```
mobile/
├── integration_test/
│   ├── common/
│   │   ├── test_app.dart          # App bootstrap with test config (server URL, etc.)
│   │   ├── patrol_config.dart     # Shared PatrolTesterConfig
│   │   └── wait_helpers.dart      # Reusable wait/retry utilities
│   ├── pages/                     # Page Object Model classes
│   │   ├── login_page.dart
│   │   ├── timeline_page.dart
│   │   ├── asset_viewer_page.dart
│   │   ├── album_page.dart
│   │   ├── search_page.dart
│   │   └── shared_space_page.dart
│   ├── fixtures/
│   │   ├── test_credentials.dart  # Login credentials (from env vars)
│   │   └── test_data.dart         # Known test assets/albums seeded on the server
│   ├── smoke/                     # Fast critical-path tests (CI on every PR)
│   │   ├── login_test.dart
│   │   ├── timeline_test.dart
│   │   └── upload_test.dart
│   └── regression/                # Comprehensive feature tests (nightly/on-demand)
│       ├── album_test.dart
│       ├── search_test.dart
│       ├── shared_spaces_test.dart
│       ├── permissions_test.dart
│       └── backup_test.dart
├── android/app/src/androidTest/   # Patrol Android native test runner
└── pubspec.yaml                   # + patrol dependency
```

### Key Patterns

- **Page Object Model**: Each screen gets a class encapsulating element finding and actions. Tests read like user stories.
- **Smoke vs Regression split**: Smoke tests gate PRs (~3-5 min). Regression runs nightly or on-demand.
- **Credentials via environment**: Server URL and credentials passed via `--dart-define` or env vars. No hardcoded secrets.

## Test Infrastructure

### Backend

Tests run against a local Immich stack via Docker Compose (the existing `e2e` profile):

- Server, PostgreSQL, Redis, ML service
- Accessible at `http://localhost:2283` (configurable via env var)

### Seed Data

A `setup_test_data.dart` fixture runs once before the test suite:

- Creates a test user via the Immich API
- Uploads ~5 sample photos (stored in `integration_test/fixtures/assets/`)
- Creates an album with 2 assets
- Creates a shared space with a member
- Teardown resets data after the suite completes

### Page Object Example

```dart
class LoginPage {
  final PatrolTester $;
  LoginPage(this.$);

  Future<void> login(String email, String password) async {
    await $(#emailInput).enterText(email);
    await $(#passwordInput).enterText(password);
    await $(#loginButton).tap();
    await $.pumpAndSettle();
  }

  Future<void> setServerUrl(String url) async {
    await $(#serverUrlInput).enterText(url);
    await $(#connectButton).tap();
  }
}
```

### Native Interactions (Patrol-specific)

- Granting photo library permission on first request
- Dismissing battery optimization dialogs
- Inspecting notification tray for background upload status
- Navigating to system settings to grant permissions after denial

## CI Pipeline

### Smoke Tests — Every PR

In `.github/workflows/test.yml`, triggered on changes to `mobile/**`:

```yaml
mobile-integration-tests:
  runs-on: ubuntu-latest
  steps:
    - Setup Flutter SDK
    - Start Immich server (docker compose)
    - Wait for server healthy
    - Create & boot Android emulator (API 33, x86_64)
      via reactivecircus/android-emulator-runner
    - Seed test data
    - Run: patrol test integration_test/smoke/
    - Upload failure screenshots as artifacts
```

- Estimated time: ~8-10 min
- Retry: `wretry.action` with 2 attempts for emulator flakiness
- Failure screenshots uploaded as GH Actions artifacts

### Regression Tests — Nightly/On-Demand

Separate workflow via `schedule` (cron) or `workflow_dispatch`:

- Runs `patrol test integration_test/` (all tests)
- Same infrastructure, broader scope

### Escape Hatch

If GH Actions emulators prove too flaky, migrate to:

- **Firebase Test Lab** (free Spark plan: 10 tests/day)
- **emulator.wtf** (Patrol team's recommendation)

Build APK + test APK, upload to device farm.

## Test Coverage Matrix

### Tested (Phase 1)

#### Smoke Suite (PR gate)

| Test            | Flows Covered                                                                           | Native Interaction     |
| --------------- | --------------------------------------------------------------------------------------- | ---------------------- |
| `login_test`    | Enter server URL, connect, login with valid credentials, verify timeline loads          | No                     |
| `timeline_test` | Scroll timeline, tap asset, verify viewer opens, swipe between assets, go back          | No                     |
| `upload_test`   | Grant photo library permission, trigger manual upload, verify asset appears in timeline | Yes — permission grant |

#### Regression Suite (Nightly)

| Test                 | Flows Covered                                                                                                         | Native Interaction                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `album_test`         | Create album, add assets to album, rename album, remove asset from album, delete album                                | No                                          |
| `search_test`        | Text search, filter by media type (photo/video), verify results display                                               | No                                          |
| `shared_spaces_test` | Create shared space, invite member, add assets, toggle "show in timeline", verify assets appear/disappear in timeline | No                                          |
| `permissions_test`   | Deny photo permission on prompt, verify error/empty state, open system settings, grant permission, verify recovery    | Yes — permission deny + settings navigation |
| `backup_test`        | Enable automatic backup in settings, verify background upload starts, check notification tray for upload status       | Yes — notification inspection               |

### Not Tested (Future Phases)

| Area                      | Flows                                                                   | Priority | Reason Deferred                                                |
| ------------------------- | ----------------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| **Map view**              | View assets on map, cluster interaction, navigate to asset from map pin | Medium   | Requires GPS location mocking, complex map widget interaction  |
| **Face recognition**      | View people section, tap person, see grouped photos                     | Medium   | Depends on ML processing time, non-deterministic grouping      |
| **CLIP/Smart search**     | Search by natural language ("dog on beach"), verify semantic results    | Medium   | ML model inference time, result quality is non-deterministic   |
| **OCR search**            | Search text found in photos                                             | Low      | Depends on ML processing, similar challenges to CLIP           |
| **Video playback**        | Play video asset, seek, pause, fullscreen                               | Medium   | Video player widget testing is fragile across emulator configs |
| **Multi-user**            | Two users sharing assets, concurrent timeline updates                   | High     | Requires managing two app instances or API-driven second user  |
| **Memories**              | View memories carousel, dismiss, navigate to asset                      | Low      | Time-dependent feature, hard to seed deterministically         |
| **Download/export**       | Download original asset to device, share to external app                | Medium   | Requires file system verification, external app interaction    |
| **Settings**              | Change theme, language, storage template, notification preferences      | Low      | Mostly UI state, well covered by widget tests                  |
| **Partner sharing**       | Add partner, view partner's assets in timeline                          | High     | Similar to shared spaces but different access model            |
| **Offline mode**          | Browse cached assets without network, verify graceful degradation       | Medium   | Requires network toggling on emulator                          |
| **Biometric auth**        | Enable app lock, verify fingerprint/face prompt on resume               | Low      | Biometric mocking varies across emulator versions              |
| **Trash/archive**         | Move to trash, restore, permanent delete, archive/unarchive             | Medium   | Straightforward CRUD, good candidate for next phase            |
| **Favorites**             | Mark favorite, filter by favorites, unfavorite                          | Medium   | Simple flow, good candidate for next phase                     |
| **Multi-select**          | Long-press to select, select multiple, batch delete/move/share          | Medium   | Gesture-heavy, worth testing but tricky on emulators           |
| **External library**      | Configure external library path, scan, verify assets imported           | Low      | Requires device storage setup                                  |
| **Server administration** | User management, storage stats, job queue (admin only)                  | Low      | Better tested via web E2E or API tests                         |
| **Widget (home screen)**  | Configure home screen widget, verify it displays recent photos          | Low      | Android widget testing requires special setup                  |

### Recommended Next Phases

**Phase 2** (high value, moderate effort):

- `trash_archive_test` — trash, restore, archive flows
- `favorites_test` — favorite/unfavorite, filter
- `multi_select_test` — batch operations
- `partner_sharing_test` — partner add/view

**Phase 3** (high value, higher effort):

- `map_test` — with GPS mocking
- `video_test` — playback controls
- `multi_user_test` — API-driven second user
- `offline_test` — network toggling

## Platform Coverage

| Platform                   | CI                                           | Local                    |
| -------------------------- | -------------------------------------------- | ------------------------ |
| Android (emulator, API 33) | Yes — every PR (smoke), nightly (regression) | Yes                      |
| iOS (simulator)            | No — requires macOS runner ($$$)             | Yes — any dev with a Mac |

## Dependencies

- `patrol: ^3.x` in `pubspec.yaml` dev_dependencies
- `patrol_cli` installed in CI (`dart pub global activate patrol_cli`)
- Android NDK/SDK already present in the project
- Docker Compose for backend (existing `e2e` profile)
- `reactivecircus/android-emulator-runner` GH Action

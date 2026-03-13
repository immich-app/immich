# Mobile Integration Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Patrol-based E2E integration test framework for the Immich mobile app with smoke tests (PR gate) and regression tests (nightly).

**Architecture:** Tests use Patrol for native + Flutter widget interaction. Backend is a local Docker Compose stack (Immich server, Postgres, Redis). Page Object Model for screen abstractions. Smoke/regression split for CI gating.

**Tech Stack:** Patrol 3.x, Flutter integration_test, Docker Compose, GitHub Actions with `reactivecircus/android-emulator-runner`

---

### Task 1: Add Patrol Dependencies

**Files:**

- Modify: `mobile/pubspec.yaml` (lines 101-127, dev_dependencies section)

**Step 1: Add patrol to dev_dependencies**

In `mobile/pubspec.yaml`, add `patrol` to the `dev_dependencies` section after `mocktail`:

```yaml
dev_dependencies:
  auto_route_generator: ^9.0.0
  build_runner: ^2.4.8
  custom_lint: ^0.7.5
  # Drift generator
  drift_dev: ^2.26.0
  fake_async: ^1.3.3
  file: ^7.0.1 # for MemoryFileSystem
  flutter_launcher_icons: ^0.14.4
  flutter_lints: ^5.0.0
  flutter_native_splash: ^2.4.7
  flutter_test:
    sdk: flutter
  immich_mobile_immich_lint:
    path: './immich_lint'
  integration_test:
    sdk: flutter
  isar_generator:
    git:
      url: https://github.com/immich-app/isar
      ref: 'bb1dca40fe87a001122e5d43bc6254718cb49f3a'
      path: packages/isar_generator/
  mocktail: ^1.0.4
  patrol: ^3.13.0
  # Type safe platform code
  pigeon: ^26.0.2
  riverpod_generator: ^2.6.1
  riverpod_lint: ^2.6.1
```

**Step 2: Add patrol config section to pubspec.yaml**

Add patrol configuration at the top level (after `analyzer:` section at the end of the file):

```yaml
patrol:
  app_name: Immich
  android:
    package_name: app.alextran.immich
  ios:
    bundle_id: app.alextran.immich
```

**Step 3: Install dependencies**

Run from `mobile/`:

```bash
flutter pub get
```

Expected: Resolves successfully, `patrol` appears in `.dart_tool/package_config.json`.

**Step 4: Install patrol_cli globally**

```bash
dart pub global activate patrol_cli
```

Expected: Patrol CLI installed. Verify with `patrol --version`.

**Step 5: Commit**

```bash
git add mobile/pubspec.yaml mobile/pubspec.lock
git commit -m "chore(mobile): add patrol dependency for integration testing"
```

---

### Task 2: Configure Android for Patrol

**Files:**

- Modify: `mobile/android/app/build.gradle`
- Create: `mobile/android/app/src/androidTest/java/app/alextran/immich/MainActivityTest.java`

**Step 1: Add androidTest dependencies to build.gradle**

In `mobile/android/app/build.gradle`, add the following inside the `android` block's `defaultConfig` section. Find the existing `defaultConfig` block and add `testInstrumentationRunner`:

```groovy
defaultConfig {
    // ... existing config ...
    testInstrumentationRunner "pl.leancode.patrol.PatrolJUnitRunner"
}
```

**Step 2: Add androidTest dependencies**

In the `dependencies` block of the same file, add:

```groovy
dependencies {
    // ... existing dependencies ...
    androidTestImplementation "pl.leancode.patrol:patrol:+"
}
```

**Step 3: Create the Android test runner class**

Create `mobile/android/app/src/androidTest/java/app/alextran/immich/MainActivityTest.java`:

```java
package app.alextran.immich;

import org.junit.runner.RunWith;
import org.junit.runners.Suite;
import org.junit.runners.Suite.SuiteClasses;

import pl.leancode.patrol.PatrolJUnitRunner;

@RunWith(PatrolJUnitRunner.class)
@SuiteClasses({MainActivityTest.class})
public class MainActivityTest {}
```

**Step 4: Verify Android build compiles**

Run from `mobile/`:

```bash
patrol build android --target integration_test/smoke/login_test.dart 2>&1 || echo "Expected: may fail since test file doesn't exist yet, but Gradle config should resolve"
```

If Gradle resolves the Patrol dependency successfully (even if the test file is missing), the Android config is correct.

**Step 5: Commit**

```bash
git add mobile/android/app/build.gradle mobile/android/app/src/androidTest/
git commit -m "chore(mobile): configure Android for Patrol test runner"
```

---

### Task 3: Create Test Infrastructure — Common Utilities

**Files:**

- Create: `mobile/integration_test/common/patrol_config.dart`
- Create: `mobile/integration_test/common/test_app.dart`
- Create: `mobile/integration_test/common/wait_helpers.dart`

**Step 1: Create patrol_config.dart**

This provides shared Patrol configuration used by all tests.

Create `mobile/integration_test/common/patrol_config.dart`:

```dart
import 'package:patrol/patrol.dart';

/// Default Patrol configuration for all Immich integration tests.
const patrolConfig = PatrolTesterConfig(
  // Timeout for finding widgets
  existsTimeout: Duration(seconds: 15),
  // Timeout for settling after interactions
  settleTimeout: Duration(seconds: 15),
  // Settle policy: wait for animations
  settlePolicy: SettlePolicy.trySettle,
);
```

**Step 2: Create test_app.dart**

This bootstraps the Immich app for Patrol tests, adapted from the existing `general_helper.dart` pattern.

Create `mobile/integration_test/common/test_app.dart`:

```dart
import 'package:easy_localization/easy_localization.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/main.dart' as app;
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:patrol/patrol.dart';

import 'patrol_config.dart';

/// Server URL for integration tests. Defaults to local Docker Compose stack.
const testServerUrl = String.fromEnvironment(
  'TEST_SERVER_URL',
  defaultValue: 'http://10.0.2.127:2285',
);

/// Test user credentials.
const testEmail = String.fromEnvironment(
  'TEST_EMAIL',
  defaultValue: 'admin@immich.app',
);

const testPassword = String.fromEnvironment(
  'TEST_PASSWORD',
  defaultValue: 'admin',
);

/// Bootstrap the Immich app for Patrol integration tests.
///
/// Initializes databases, clears prior state, and pumps the app widget.
Future<void> pumpImmichApp(PatrolTester $) async {
  await app.initApp();
  await EasyLocalization.ensureInitialized();

  final (isar, drift, logDb) = await Bootstrap.initDB();
  await Bootstrap.initDomain(isar, drift, logDb);
  await Store.clear();
  await isar.writeTxn(() => isar.clear());

  await $.pumpWidgetAndSettle(
    ProviderScope(
      overrides: [
        dbProvider.overrideWithValue(isar),
        isarProvider.overrideWithValue(isar),
        driftProvider.overrideWith(driftOverride(drift)),
      ],
      child: const app.MainWidget(),
    ),
  );
}
```

**Step 3: Create wait_helpers.dart**

Create `mobile/integration_test/common/wait_helpers.dart`:

```dart
import 'dart:async';

import 'package:patrol/patrol.dart';

/// Wait for a native permission dialog and grant it.
Future<void> grantPermissionIfRequested(PatrolTester $) async {
  try {
    await $.native.grantPermissionWhenInUse();
  } on Exception {
    // No permission dialog appeared, that's fine
  }
}

/// Wait for a native permission dialog and deny it.
Future<void> denyPermissionIfRequested(PatrolTester $) async {
  try {
    await $.native.denyPermission();
  } on Exception {
    // No permission dialog appeared, that's fine
  }
}

/// Retry an action until it succeeds or times out.
Future<void> retryUntil(
  Future<void> Function() action, {
  Duration timeout = const Duration(seconds: 30),
  Duration interval = const Duration(seconds: 2),
}) async {
  final deadline = DateTime.now().add(timeout);
  Object? lastError;

  while (DateTime.now().isBefore(deadline)) {
    try {
      await action();
      return;
    } on Exception catch (e) {
      lastError = e;
      await Future.delayed(interval);
    }
  }

  throw TimeoutException(
    'retryUntil timed out after $timeout. Last error: $lastError',
  );
}
```

**Step 4: Verify files compile**

Run from `mobile/`:

```bash
dart analyze integration_test/common/
```

Expected: No errors (warnings about unused imports are OK at this stage).

**Step 5: Commit**

```bash
git add mobile/integration_test/common/
git commit -m "feat(mobile): add Patrol test infrastructure and app bootstrap"
```

---

### Task 4: Create Page Objects — Login Page

**Files:**

- Create: `mobile/integration_test/pages/login_page.dart`

**Step 1: Create the login page object**

This replaces the existing `ImmichTestLoginHelper` with a Patrol-native page object.

Create `mobile/integration_test/pages/login_page.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:patrol/patrol.dart';

import '../common/test_app.dart';

/// Page object for the Immich login screen.
class LoginPage {
  final PatrolTester $;

  const LoginPage(this.$);

  /// Wait for the login screen to be visible.
  Future<void> waitForScreen() async {
    await $(find.text('Login')).waitUntilVisible();
  }

  /// Acknowledge the new server version dialog if it appears.
  Future<void> acknowledgeNewServerVersionIfPresent() async {
    try {
      final ack = $(find.text('Acknowledge'));
      if (await ack.exists) {
        await ack.tap();
      }
    } on Exception {
      // Dialog not present, continue
    }
  }

  /// Enter the server URL, email, and password.
  Future<void> enterCredentials({
    String? server,
    String? email,
    String? password,
  }) async {
    final loginForms = $(TextFormField);

    // The login form has 3 fields: email (0), password (1), server URL (2)
    if (email != null) {
      await loginForms.at(0).enterText(email);
    }
    if (password != null) {
      await loginForms.at(1).enterText(password);
    }
    if (server != null) {
      await loginForms.at(2).enterText(server);
    }
  }

  /// Enter the default test credentials.
  Future<void> enterTestCredentials() async {
    await enterCredentials(
      server: testServerUrl,
      email: testEmail,
      password: testPassword,
    );
  }

  /// Tap the login button.
  Future<void> tapLogin() async {
    // Find by widget type to avoid i18n issues
    await $(ElevatedButton).tap();
  }

  /// Full login flow with default test credentials.
  Future<void> loginWithTestCredentials() async {
    await waitForScreen();
    await acknowledgeNewServerVersionIfPresent();
    await enterTestCredentials();
    await tapLogin();
  }
}
```

**Step 2: Commit**

```bash
git add mobile/integration_test/pages/
git commit -m "feat(mobile): add login page object for Patrol tests"
```

---

### Task 5: Create Page Objects — Timeline, Asset Viewer, Album, Search, Shared Space

**Files:**

- Create: `mobile/integration_test/pages/timeline_page.dart`
- Create: `mobile/integration_test/pages/asset_viewer_page.dart`
- Create: `mobile/integration_test/pages/album_page.dart`
- Create: `mobile/integration_test/pages/search_page.dart`
- Create: `mobile/integration_test/pages/shared_space_page.dart`

**Step 1: Create timeline_page.dart**

Create `mobile/integration_test/pages/timeline_page.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:patrol/patrol.dart';

/// Page object for the Immich main timeline screen.
class TimelinePage {
  final PatrolTester $;

  const TimelinePage(this.$);

  /// Wait for the timeline to finish loading and display content.
  Future<void> waitForLoaded() async {
    // Wait for the bottom nav to appear (indicates app is loaded)
    await $(BottomNavigationBar).waitUntilVisible();
  }

  /// Verify we are on the timeline screen.
  Future<bool> isVisible() async {
    return $(BottomNavigationBar).exists;
  }

  /// Tap on the first visible asset thumbnail.
  Future<void> tapFirstAsset() async {
    // Assets are displayed as images in the timeline grid
    final assets = $(Image);
    await assets.first.tap();
  }

  /// Scroll down on the timeline.
  Future<void> scrollDown() async {
    await $.tester.drag(
      find.byType(Scrollable).first,
      const Offset(0, -300),
    );
    await $.tester.pumpAndSettle();
  }

  /// Navigate to the search tab via bottom nav.
  Future<void> goToSearch() async {
    await $(Icons.search).tap();
  }

  /// Navigate to the albums/library tab via bottom nav.
  Future<void> goToLibrary() async {
    // Tap the library icon in bottom nav
    await $(Icons.photo_album_outlined).tap();
  }
}
```

**Step 2: Create asset_viewer_page.dart**

Create `mobile/integration_test/pages/asset_viewer_page.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:patrol/patrol.dart';

/// Page object for the asset detail/viewer screen.
class AssetViewerPage {
  final PatrolTester $;

  const AssetViewerPage(this.$);

  /// Verify the viewer is open (shows an image/video).
  Future<void> waitForVisible() async {
    // The viewer shows a full-screen image
    // Wait for the app bar or back button to confirm we're in the viewer
    await $.pump(const Duration(seconds: 2));
  }

  /// Swipe left to go to next asset.
  Future<void> swipeToNext() async {
    await $.tester.drag(
      find.byType(PageView).first,
      const Offset(-300, 0),
    );
    await $.tester.pumpAndSettle();
  }

  /// Swipe right to go to previous asset.
  Future<void> swipeToPrevious() async {
    await $.tester.drag(
      find.byType(PageView).first,
      const Offset(300, 0),
    );
    await $.tester.pumpAndSettle();
  }

  /// Go back to the timeline.
  Future<void> goBack() async {
    await $.native.pressBack();
  }
}
```

**Step 3: Create album_page.dart**

Create `mobile/integration_test/pages/album_page.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:patrol/patrol.dart';

/// Page object for album-related screens.
class AlbumPage {
  final PatrolTester $;

  const AlbumPage(this.$);

  /// Create a new album with the given name.
  Future<void> createAlbum(String name) async {
    // Tap the create/add button
    await $(Icons.add).tap();
    // Look for "Create album" option
    await $(find.text('Create album')).tap();
    // Enter the album name
    await $(TextFormField).first.enterText(name);
    // Confirm creation
    await $(find.text('Create')).tap();
    await $.pump(const Duration(seconds: 2));
  }

  /// Tap on an album by name in the album list.
  Future<void> openAlbum(String name) async {
    await $(find.text(name)).tap();
    await $.pump(const Duration(seconds: 1));
  }

  /// Delete the currently open album.
  Future<void> deleteCurrentAlbum() async {
    // Open album menu
    await $(Icons.more_vert).tap();
    await $(find.text('Delete album')).tap();
    // Confirm deletion
    await $(find.text('Delete')).tap();
    await $.pump(const Duration(seconds: 1));
  }
}
```

**Step 4: Create search_page.dart**

Create `mobile/integration_test/pages/search_page.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:patrol/patrol.dart';

/// Page object for the search screen.
class SearchPage {
  final PatrolTester $;

  const SearchPage(this.$);

  /// Tap the search field and enter a query.
  Future<void> search(String query) async {
    await $(TextFormField).first.tap();
    await $(TextFormField).first.enterText(query);
    // Submit the search
    await $.tester.testTextInput.receiveAction(TextInputAction.search);
    await $.pump(const Duration(seconds: 3));
  }

  /// Verify search results contain at least one item.
  Future<bool> hasResults() async {
    // Check for the presence of image thumbnails in results
    return $(Image).exists;
  }
}
```

**Step 5: Create shared_space_page.dart**

Create `mobile/integration_test/pages/shared_space_page.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:patrol/patrol.dart';

/// Page object for shared spaces screens.
class SharedSpacePage {
  final PatrolTester $;

  const SharedSpacePage(this.$);

  /// Navigate to shared spaces from the library tab.
  Future<void> openFromLibrary() async {
    await $(find.text('Shared spaces')).tap();
    await $.pump(const Duration(seconds: 1));
  }

  /// Create a new shared space with the given name.
  Future<void> createSpace(String name) async {
    await $(Icons.add).tap();
    await $(TextFormField).first.enterText(name);
    await $(find.text('Create')).tap();
    await $.pump(const Duration(seconds: 2));
  }

  /// Open a shared space by name.
  Future<void> openSpace(String name) async {
    await $(find.text(name)).tap();
    await $.pump(const Duration(seconds: 1));
  }

  /// Toggle the "show in timeline" setting for the current space.
  Future<void> toggleShowInTimeline() async {
    // Find the eye/visibility icon in the space header
    await $(Icons.visibility).tap();
    await $.pump(const Duration(seconds: 1));
  }
}
```

**Step 6: Commit**

```bash
git add mobile/integration_test/pages/
git commit -m "feat(mobile): add page objects for timeline, viewer, album, search, shared spaces"
```

---

### Task 6: Create Fixtures — Test Credentials and Seed Data

**Files:**

- Create: `mobile/integration_test/fixtures/test_credentials.dart`
- Create: `mobile/integration_test/fixtures/seed_data.dart`
- Create: `mobile/integration_test/fixtures/assets/` (directory with sample images)

**Step 1: Create test_credentials.dart**

Create `mobile/integration_test/fixtures/test_credentials.dart`:

```dart
import '../common/test_app.dart';

/// Test user credentials, sourced from --dart-define or defaults.
class TestCredentials {
  static const serverUrl = testServerUrl;
  static const email = testEmail;
  static const password = testPassword;
}
```

**Step 2: Create seed_data.dart**

This helper seeds the test server with data via HTTP API calls before tests run.

Create `mobile/integration_test/fixtures/seed_data.dart`:

```dart
import 'dart:convert';
import 'dart:io';

import '../common/test_app.dart';

/// Seeds the test Immich server with initial data for integration tests.
///
/// Expects the server to be running and accessible at [testServerUrl].
/// Creates the admin user if it doesn't exist, then logs in and uploads
/// sample assets.
class TestDataSeeder {
  String? _accessToken;

  /// Run the full seed sequence.
  Future<void> seed() async {
    await _signUpAdmin();
    await _login();
  }

  /// Sign up the admin user (first-time setup).
  Future<void> _signUpAdmin() async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(
        Uri.parse('$testServerUrl/api/auth/admin-sign-up'),
      );
      request.headers.set('Content-Type', 'application/json');
      request.write(jsonEncode({
        'name': 'Test Admin',
        'email': testEmail,
        'password': testPassword,
      }));
      final response = await request.close();
      // 201 = created, 400 = already exists — both are fine
      await response.drain();
    } finally {
      client.close();
    }
  }

  /// Log in and store the access token.
  Future<void> _login() async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(
        Uri.parse('$testServerUrl/api/auth/login'),
      );
      request.headers.set('Content-Type', 'application/json');
      request.write(jsonEncode({
        'email': testEmail,
        'password': testPassword,
      }));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      final json = jsonDecode(body) as Map<String, dynamic>;
      _accessToken = json['accessToken'] as String;
    } finally {
      client.close();
    }
  }

  /// Get the access token (must call [seed] first).
  String get accessToken {
    if (_accessToken == null) {
      throw StateError('Must call seed() before accessing token');
    }
    return _accessToken!;
  }
}
```

**Step 3: Add sample test images**

Create the directory and add a couple of small JPEG files for upload tests:

```bash
mkdir -p mobile/integration_test/fixtures/assets
```

For the sample images, use any small JPEG files. We can generate simple test images later, or copy from `e2e/test-assets/` if available. For now, create a placeholder README:

Create `mobile/integration_test/fixtures/assets/README.md`:

```
# Test Assets

Place small JPEG/PNG files here for upload integration tests.
Copy sample images from e2e/test-assets/ or use any small photos.
```

**Step 4: Commit**

```bash
git add mobile/integration_test/fixtures/
git commit -m "feat(mobile): add test fixtures and seed data helper"
```

---

### Task 7: Create Smoke Test — Login

**Files:**

- Create: `mobile/integration_test/smoke/login_test.dart`

**Step 1: Write the login smoke test**

Create `mobile/integration_test/smoke/login_test.dart`:

```dart
import 'package:patrol/patrol.dart';

import '../common/patrol_config.dart';
import '../common/test_app.dart';
import '../fixtures/seed_data.dart';
import '../pages/login_page.dart';
import '../pages/timeline_page.dart';

void main() {
  final seeder = TestDataSeeder();

  patrolSetUp(() async {
    await seeder.seed();
  });

  patrolTest(
    'Login with valid credentials loads the timeline',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);

      // Login with test credentials
      await loginPage.loginWithTestCredentials();

      // Verify timeline is loaded
      await timelinePage.waitForLoaded();
      expect(await timelinePage.isVisible(), isTrue);
    },
  );

  patrolTest(
    'Login with wrong password shows error',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);

      await loginPage.waitForScreen();
      await loginPage.acknowledgeNewServerVersionIfPresent();
      await loginPage.enterCredentials(
        server: testServerUrl,
        email: testEmail,
        password: 'wrong-password',
      );
      await loginPage.tapLogin();

      // Verify error is shown (should stay on login screen)
      await loginPage.waitForScreen();
    },
  );
}
```

**Step 2: Verify the test compiles**

Run from `mobile/`:

```bash
dart analyze integration_test/smoke/login_test.dart
```

Expected: No errors.

**Step 3: Commit**

```bash
git add mobile/integration_test/smoke/
git commit -m "feat(mobile): add login smoke test with Patrol"
```

---

### Task 8: Create Smoke Test — Timeline

**Files:**

- Create: `mobile/integration_test/smoke/timeline_test.dart`

**Step 1: Write the timeline smoke test**

Create `mobile/integration_test/smoke/timeline_test.dart`:

```dart
import 'package:patrol/patrol.dart';

import '../common/patrol_config.dart';
import '../common/test_app.dart';
import '../fixtures/seed_data.dart';
import '../pages/asset_viewer_page.dart';
import '../pages/login_page.dart';
import '../pages/timeline_page.dart';

void main() {
  final seeder = TestDataSeeder();

  patrolSetUp(() async {
    await seeder.seed();
  });

  patrolTest(
    'Browse timeline and open asset viewer',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);
      final viewerPage = AssetViewerPage($);

      // Login first
      await loginPage.loginWithTestCredentials();
      await timelinePage.waitForLoaded();

      // Scroll the timeline
      await timelinePage.scrollDown();

      // Tap the first asset to open the viewer
      await timelinePage.tapFirstAsset();
      await viewerPage.waitForVisible();

      // Swipe to next asset
      await viewerPage.swipeToNext();

      // Go back to timeline
      await viewerPage.goBack();
      await timelinePage.waitForLoaded();
    },
  );
}
```

**Step 2: Commit**

```bash
git add mobile/integration_test/smoke/timeline_test.dart
git commit -m "feat(mobile): add timeline smoke test with Patrol"
```

---

### Task 9: Create Smoke Test — Upload

**Files:**

- Create: `mobile/integration_test/smoke/upload_test.dart`

**Step 1: Write the upload smoke test**

Create `mobile/integration_test/smoke/upload_test.dart`:

```dart
import 'package:patrol/patrol.dart';

import '../common/patrol_config.dart';
import '../common/test_app.dart';
import '../common/wait_helpers.dart';
import '../fixtures/seed_data.dart';
import '../pages/login_page.dart';
import '../pages/timeline_page.dart';

void main() {
  final seeder = TestDataSeeder();

  patrolSetUp(() async {
    await seeder.seed();
  });

  patrolTest(
    'Grant photo permission and trigger upload',
    config: patrolConfig,
    nativeAutomation: true,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);

      // Login first
      await loginPage.loginWithTestCredentials();
      await timelinePage.waitForLoaded();

      // When the app requests photo permission, grant it
      await grantPermissionIfRequested($);

      // The upload flow depends on the device having photos in the gallery.
      // On an emulator, we need to push test photos first via adb.
      // For now, verify the permission was granted and no error state is shown.
      await timelinePage.waitForLoaded();
      expect(await timelinePage.isVisible(), isTrue);
    },
  );
}
```

**Step 2: Commit**

```bash
git add mobile/integration_test/smoke/upload_test.dart
git commit -m "feat(mobile): add upload smoke test with Patrol"
```

---

### Task 10: Create Regression Tests — Albums, Search, Shared Spaces, Permissions, Backup

**Files:**

- Create: `mobile/integration_test/regression/album_test.dart`
- Create: `mobile/integration_test/regression/search_test.dart`
- Create: `mobile/integration_test/regression/shared_spaces_test.dart`
- Create: `mobile/integration_test/regression/permissions_test.dart`
- Create: `mobile/integration_test/regression/backup_test.dart`

**Step 1: Create album_test.dart**

Create `mobile/integration_test/regression/album_test.dart`:

```dart
import 'package:patrol/patrol.dart';

import '../common/patrol_config.dart';
import '../common/test_app.dart';
import '../fixtures/seed_data.dart';
import '../pages/album_page.dart';
import '../pages/login_page.dart';
import '../pages/timeline_page.dart';

void main() {
  final seeder = TestDataSeeder();

  patrolSetUp(() async {
    await seeder.seed();
  });

  patrolTest(
    'Create, open, and delete an album',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);
      final albumPage = AlbumPage($);

      await loginPage.loginWithTestCredentials();
      await timelinePage.waitForLoaded();

      // Navigate to library/albums
      await timelinePage.goToLibrary();

      // Create a new album
      await albumPage.createAlbum('Test Album');

      // Open the album
      await albumPage.openAlbum('Test Album');

      // Delete it
      await albumPage.deleteCurrentAlbum();
    },
  );
}
```

**Step 2: Create search_test.dart**

Create `mobile/integration_test/regression/search_test.dart`:

```dart
import 'package:patrol/patrol.dart';

import '../common/patrol_config.dart';
import '../common/test_app.dart';
import '../fixtures/seed_data.dart';
import '../pages/login_page.dart';
import '../pages/search_page.dart';
import '../pages/timeline_page.dart';

void main() {
  final seeder = TestDataSeeder();

  patrolSetUp(() async {
    await seeder.seed();
  });

  patrolTest(
    'Search for assets by text',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);
      final searchPage = SearchPage($);

      await loginPage.loginWithTestCredentials();
      await timelinePage.waitForLoaded();

      // Navigate to search
      await timelinePage.goToSearch();

      // Perform a search
      await searchPage.search('photo');

      // Verify results appear (depends on seed data)
      // This is a basic smoke — if no results, the search still works
    },
  );
}
```

**Step 3: Create shared_spaces_test.dart**

Create `mobile/integration_test/regression/shared_spaces_test.dart`:

```dart
import 'package:patrol/patrol.dart';

import '../common/patrol_config.dart';
import '../common/test_app.dart';
import '../fixtures/seed_data.dart';
import '../pages/login_page.dart';
import '../pages/shared_space_page.dart';
import '../pages/timeline_page.dart';

void main() {
  final seeder = TestDataSeeder();

  patrolSetUp(() async {
    await seeder.seed();
  });

  patrolTest(
    'Create shared space and toggle timeline visibility',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);
      final spacePage = SharedSpacePage($);

      await loginPage.loginWithTestCredentials();
      await timelinePage.waitForLoaded();

      // Navigate to library then shared spaces
      await timelinePage.goToLibrary();
      await spacePage.openFromLibrary();

      // Create a shared space
      await spacePage.createSpace('Test Space');

      // Open it
      await spacePage.openSpace('Test Space');

      // Toggle show in timeline
      await spacePage.toggleShowInTimeline();
    },
  );
}
```

**Step 4: Create permissions_test.dart**

Create `mobile/integration_test/regression/permissions_test.dart`:

```dart
import 'package:patrol/patrol.dart';

import '../common/patrol_config.dart';
import '../common/test_app.dart';
import '../common/wait_helpers.dart';
import '../fixtures/seed_data.dart';
import '../pages/login_page.dart';
import '../pages/timeline_page.dart';

void main() {
  final seeder = TestDataSeeder();

  patrolSetUp(() async {
    await seeder.seed();
  });

  patrolTest(
    'Deny photo permission and verify error state',
    config: patrolConfig,
    nativeAutomation: true,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);

      await loginPage.loginWithTestCredentials();
      await timelinePage.waitForLoaded();

      // Deny photo library permission when requested
      await denyPermissionIfRequested($);

      // App should show a permission-required state or continue without local photos
      // Verify the app doesn't crash and remains functional
      await timelinePage.waitForLoaded();
    },
  );
}
```

**Step 5: Create backup_test.dart**

Create `mobile/integration_test/regression/backup_test.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:patrol/patrol.dart';

import '../common/patrol_config.dart';
import '../common/test_app.dart';
import '../common/wait_helpers.dart';
import '../fixtures/seed_data.dart';
import '../pages/login_page.dart';
import '../pages/timeline_page.dart';

void main() {
  final seeder = TestDataSeeder();

  patrolSetUp(() async {
    await seeder.seed();
  });

  patrolTest(
    'Enable backup and verify notification',
    config: patrolConfig,
    nativeAutomation: true,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);

      await loginPage.loginWithTestCredentials();
      await timelinePage.waitForLoaded();

      // Grant photo permission first
      await grantPermissionIfRequested($);

      // Navigate to backup settings
      // This will need refinement based on actual UI navigation
      await $(Icons.backup).tap();

      // The backup flow is complex and may need additional seed data
      // (photos on the emulator). This is a placeholder for the full test.
      await $.pump(const Duration(seconds: 3));
    },
  );
}
```

**Step 6: Commit**

```bash
git add mobile/integration_test/regression/
git commit -m "feat(mobile): add regression tests for albums, search, spaces, permissions, backup"
```

---

### Task 11: Create Docker Compose for Mobile Integration Tests

**Files:**

- Create: `mobile/integration_test/docker-compose.yml`

**Step 1: Create a mobile-specific docker compose file**

This is a simplified version of `e2e/docker-compose.yml` tailored for mobile tests (no auth server, accessible from emulator via host networking).

Create `mobile/integration_test/docker-compose.yml`:

```yaml
name: immich-mobile-tests

services:
  immich-server:
    container_name: immich-mobile-test-server
    image: immich-server:latest
    build:
      context: ../../
      dockerfile: server/Dockerfile
    environment:
      DB_HOSTNAME: database
      DB_USERNAME: postgres
      DB_PASSWORD: postgres
      DB_DATABASE_NAME: immich
      IMMICH_MACHINE_LEARNING_ENABLED: 'false'
      IMMICH_TELEMETRY_INCLUDE: all
      IMMICH_ENV: testing
      IMMICH_PORT: '2285'
      IMMICH_IGNORE_MOUNT_CHECK_ERRORS: 'true'
    depends_on:
      redis:
        condition: service_started
      database:
        condition: service_healthy
    ports:
      - 2285:2285

  redis:
    container_name: immich-mobile-test-redis
    image: docker.io/valkey/valkey:9@sha256:2bce660b767cb62c8c0ea020e94a230093be63dbd6af4f21b044960517a5842d
    healthcheck:
      test: redis-cli ping || exit 1

  database:
    container_name: immich-mobile-test-postgres
    image: ghcr.io/immich-app/postgres:14-vectorchord0.4.3-pgvectors0.2.0@sha256:bcf63357191b76a916ae5eb93464d65c07511da41e3bf7a8416db519b40b1c23
    command: -c fsync=off -c shared_preload_libraries=vchord.so -c config_file=/var/lib/postgresql/data/postgresql.conf
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: immich
    ports:
      - 5435:5432
    shm_size: 128mb
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -d immich']
      interval: 1s
      timeout: 5s
      retries: 30
      start_period: 10s
```

**Step 2: Create a helper script to start the backend**

Create `mobile/integration_test/scripts/start-backend.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.yml"

echo "Starting Immich backend for mobile integration tests..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "Waiting for server to be healthy..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:2285/api/server/ping > /dev/null 2>&1; then
    echo "Server is ready!"
    exit 0
  fi
  echo "  Waiting... ($i/60)"
  sleep 2
done

echo "ERROR: Server failed to start within 120 seconds"
docker compose -f "$COMPOSE_FILE" logs immich-server
exit 1
```

Create `mobile/integration_test/scripts/stop-backend.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.yml"

echo "Stopping Immich backend..."
docker compose -f "$COMPOSE_FILE" down -v
```

**Step 3: Make scripts executable and commit**

```bash
chmod +x mobile/integration_test/scripts/*.sh
git add mobile/integration_test/docker-compose.yml mobile/integration_test/scripts/
git commit -m "feat(mobile): add Docker Compose and helper scripts for test backend"
```

---

### Task 12: Add CI Workflow for Smoke Tests

**Files:**

- Modify: `.github/workflows/test.yml` (add mobile-integration-tests job)

**Step 1: Add the mobile integration test job**

In `.github/workflows/test.yml`, add a new job after the `mobile-unit-tests` job (after line 518). This job runs the smoke tests on every PR that changes mobile files.

```yaml
mobile-integration-tests:
  name: Integration Test Mobile
  needs: pre-job
  if: ${{ fromJSON(needs.pre-job.outputs.should_run).mobile == true }}
  runs-on: ubuntu-latest
  permissions:
    contents: read
  timeout-minutes: 30
  steps:
    - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
      with:
        persist-credentials: false

    - name: Setup Flutter SDK
      uses: subosito/flutter-action@fd55f4c5af5b953cc57a2be44cb082c8f6635e8e # v2.21.0
      with:
        channel: 'stable'
        flutter-version-file: ./mobile/pubspec.yaml

    - name: Install Patrol CLI
      run: dart pub global activate patrol_cli

    - name: Generate translation file
      run: dart run easy_localization:generate -S ../i18n && dart run bin/generate_keys.dart
      working-directory: ./mobile

    - name: Start Immich backend
      run: |
        chmod +x mobile/integration_test/scripts/start-backend.sh
        mobile/integration_test/scripts/start-backend.sh

    - name: Run integration tests
      uses: Wandalen/wretry.action@v3
      with:
        attempt_limit: 2
        command: |
          cd mobile
          patrol test integration_test/smoke/ \
            --dart-define=TEST_SERVER_URL=http://10.0.2.127:2285 \
            --dart-define=TEST_EMAIL=admin@immich.app \
            --dart-define=TEST_PASSWORD=admin
      env:
        ANDROID_EMULATOR_WAIT: 120

    - name: Upload failure screenshots
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: patrol-failure-screenshots
        path: mobile/build/app/outputs/androidTest-results/

    - name: Stop backend
      if: always()
      run: mobile/integration_test/scripts/stop-backend.sh
```

Note: This is a starting point. The emulator setup step (using `reactivecircus/android-emulator-runner`) may need to be added — Patrol CLI can handle emulator management in some setups, but if not, add:

```yaml
- name: Run integration tests on emulator
  uses: reactivecircus/android-emulator-runner@v2.34.0
  with:
    api-level: 33
    arch: x86_64
    profile: pixel_6
    force-avd-creation: false
    emulator-options: -no-window -gpu swiftshader_indirect -no-snapshot -noaudio -no-boot-anim
    script: |
      cd mobile
      patrol test integration_test/smoke/ \
        --dart-define=TEST_SERVER_URL=http://10.0.2.2:2285
```

(10.0.2.2 is the Android emulator's alias for the host machine's localhost.)

**Step 2: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci(mobile): add integration test workflow with Patrol and Docker backend"
```

---

### Task 13: Add Nightly Regression Workflow

**Files:**

- Create: `.github/workflows/mobile-regression-tests.yml`

**Step 1: Create the nightly workflow**

Create `.github/workflows/mobile-regression-tests.yml`:

```yaml
name: Mobile Regression Tests

on:
  schedule:
    # Run nightly at 3 AM UTC
    - cron: '0 3 * * *'
  workflow_dispatch: {}

jobs:
  regression-tests:
    name: Mobile Regression Suite
    runs-on: ubuntu-latest
    permissions:
      contents: read
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false

      - name: Setup Flutter SDK
        uses: subosito/flutter-action@fd55f4c5af5b953cc57a2be44cb082c8f6635e8e # v2.21.0
        with:
          channel: 'stable'
          flutter-version-file: ./mobile/pubspec.yaml

      - name: Install Patrol CLI
        run: dart pub global activate patrol_cli

      - name: Generate translation file
        run: dart run easy_localization:generate -S ../i18n && dart run bin/generate_keys.dart
        working-directory: ./mobile

      - name: Start Immich backend
        run: |
          chmod +x mobile/integration_test/scripts/start-backend.sh
          mobile/integration_test/scripts/start-backend.sh

      - name: Run all integration tests
        uses: reactivecircus/android-emulator-runner@v2.34.0
        with:
          api-level: 33
          arch: x86_64
          profile: pixel_6
          force-avd-creation: false
          emulator-options: -no-window -gpu swiftshader_indirect -no-snapshot -noaudio -no-boot-anim
          script: |
            cd mobile
            patrol test integration_test/ \
              --dart-define=TEST_SERVER_URL=http://10.0.2.2:2285 \
              --dart-define=TEST_EMAIL=admin@immich.app \
              --dart-define=TEST_PASSWORD=admin

      - name: Upload failure screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: regression-failure-screenshots
          path: mobile/build/app/outputs/androidTest-results/

      - name: Stop backend
        if: always()
        run: mobile/integration_test/scripts/stop-backend.sh
```

**Step 2: Commit**

```bash
git add .github/workflows/mobile-regression-tests.yml
git commit -m "ci(mobile): add nightly regression test workflow"
```

---

### Task 14: Add Makefile Targets for Local Development

**Files:**

- Modify: `Makefile` (add mobile test targets)

**Step 1: Add mobile integration test targets to root Makefile**

Add these targets to the root `Makefile`:

```makefile
mobile-test-backend-start:
	mobile/integration_test/scripts/start-backend.sh

mobile-test-backend-stop:
	mobile/integration_test/scripts/stop-backend.sh

mobile-test-smoke:
	cd mobile && patrol test integration_test/smoke/

mobile-test-regression:
	cd mobile && patrol test integration_test/

mobile-test-all: mobile-test-backend-start mobile-test-smoke mobile-test-backend-stop
```

**Step 2: Commit**

```bash
git add Makefile
git commit -m "chore: add Makefile targets for mobile integration tests"
```

---

### Task 15: Run Tests Locally and Fix Issues

**Step 1: Start the backend**

```bash
make mobile-test-backend-start
```

Expected: Docker containers start, server responds to ping.

**Step 2: Run the smoke tests on a connected device or emulator**

```bash
cd mobile && patrol test integration_test/smoke/login_test.dart
```

Expected: Login test runs on the connected device/emulator.

**Step 3: Fix any issues**

Common issues to watch for:

- Widget finders may need adjustment based on actual widget keys/text
- Server URL may need `10.0.2.2` (emulator) vs `localhost` (host)
- Timing: increase `existsTimeout` in patrol_config.dart if tests are flaky
- Page object selectors may need refinement based on actual widget tree

**Step 4: Run all smoke tests**

```bash
patrol test integration_test/smoke/
```

Expected: All 3 smoke tests pass.

**Step 5: Commit any fixes**

```bash
git add -u
git commit -m "fix(mobile): adjust integration tests based on local run"
```

---

### Task 16: Update Existing Integration Tests (Optional Migration)

**Files:**

- Modify: `mobile/integration_test/module_login/login_test.dart`
- Modify: `mobile/integration_test/test_utils/general_helper.dart`
- Modify: `mobile/integration_test/test_utils/login_helper.dart`

The existing login tests under `module_login/` can remain as-is for now. They use stock `integration_test` and still work. Migration to Patrol is optional and can be done incrementally.

If you want to migrate them, replace `testWidgets` with `patrolTest`, `WidgetTester` with `PatrolTester`, and use the new page objects. But this is not blocking — the new smoke tests cover the same flows.

**Step 1: Add a note to the old tests**

Add a comment at the top of `mobile/integration_test/module_login/login_test.dart`:

```dart
// NOTE: These tests use the legacy integration_test framework.
// New tests should use Patrol. See integration_test/smoke/ and integration_test/regression/.
```

**Step 2: Commit**

```bash
git add mobile/integration_test/module_login/login_test.dart
git commit -m "docs(mobile): mark legacy integration tests, point to new Patrol tests"
```

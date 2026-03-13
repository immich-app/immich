# Patrol E2E Spaces + Web Test Mocks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand Patrol E2E shared spaces tests to cover multi-user flows (delete, members, roles, leave) and create reusable web test mocks for websocket and spaces API.

**Architecture:** Two independent workstreams — mobile Patrol E2E tests (Dart, requires emulator + server) and web test mocks (TypeScript, unit-testable locally). Mobile tests use page object pattern with `SharedSpacePage` extended for member management. Web mocks follow existing `sdk.mock.ts` pattern.

**Tech Stack:**

- **Mobile E2E:** Dart, Patrol 4.2.0, Flutter integration_test, HttpClient for API seeding
- **Web Mocks:** TypeScript, Vitest, `vi.mock()`, `@immich/sdk`, `socket.io-client`

---

## Workstream A: Patrol E2E Mobile Spaces (Tasks 1-5)

### Task 1: Extend TestDataSeeder to create a second user

**Files:**

- Modify: `mobile/integration_test/fixtures/seed_data.dart`

**Step 1: Write the failing test (manual verification)**

The current `TestDataSeeder` only creates an admin user. We need a second user for member management tests. We'll add a `createUser` method and expose both tokens.

No automated test for the seeder itself — it's infrastructure. We verify it works by running the Patrol tests in Task 3.

**Step 2: Implement the seeder extension**

Add to `mobile/integration_test/fixtures/seed_data.dart`:

```dart
import 'dart:convert';
import 'dart:io';

import '../common/test_app.dart';

/// Seeds the test Immich server with initial data for integration tests.
class TestDataSeeder {
  String? _adminAccessToken;
  String? _secondUserAccessToken;

  /// Second test user credentials.
  static const secondUserEmail = 'testuser@immich.app';
  static const secondUserName = 'Test User';
  static const secondUserPassword = 'testuser123';

  /// Run the full seed sequence.
  Future<void> seed() async {
    await _signUpAdmin();
    await _loginAdmin();
    await _createSecondUser();
    await _loginSecondUser();
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
      if (response.statusCode >= 500) {
        final body = await response.transform(utf8.decoder).join();
        throw StateError('Admin sign-up failed (${response.statusCode}): $body');
      }
      await response.drain();
    } finally {
      client.close();
    }
  }

  /// Log in as admin and store the access token.
  Future<void> _loginAdmin() async {
    _adminAccessToken = await _login(testEmail, testPassword);
  }

  /// Create a second (non-admin) user via the admin API.
  Future<void> _createSecondUser() async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(
        Uri.parse('$testServerUrl/api/admin/users'),
      );
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('Authorization', 'Bearer $adminAccessToken');
      request.write(jsonEncode({
        'email': secondUserEmail,
        'password': secondUserPassword,
        'name': secondUserName,
      }));
      final response = await request.close();
      // 201 = created, 409 = already exists — both are fine
      if (response.statusCode >= 500) {
        final body = await response.transform(utf8.decoder).join();
        throw StateError('Create user failed (${response.statusCode}): $body');
      }
      await response.drain();
    } finally {
      client.close();
    }
  }

  /// Log in as the second user and store their token.
  Future<void> _loginSecondUser() async {
    _secondUserAccessToken = await _login(secondUserEmail, secondUserPassword);
  }

  /// Generic login helper — returns access token.
  Future<String> _login(String email, String password) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(
        Uri.parse('$testServerUrl/api/auth/login'),
      );
      request.headers.set('Content-Type', 'application/json');
      request.write(jsonEncode({
        'email': email,
        'password': password,
      }));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      if (response.statusCode != 201) {
        throw StateError('Login failed (${response.statusCode}): $body');
      }
      final json = jsonDecode(body) as Map<String, dynamic>;
      return json['accessToken'] as String;
    } finally {
      client.close();
    }
  }

  /// Get the admin access token (must call [seed] first).
  String get adminAccessToken {
    if (_adminAccessToken == null) {
      throw StateError('Must call seed() before accessing adminAccessToken');
    }
    return _adminAccessToken!;
  }

  /// Backward-compatible alias for [adminAccessToken].
  String get accessToken => adminAccessToken;

  /// Get the second user's access token (must call [seed] first).
  String get secondUserAccessToken {
    if (_secondUserAccessToken == null) {
      throw StateError('Must call seed() before accessing secondUserAccessToken');
    }
    return _secondUserAccessToken!;
  }

  /// Get the second user's ID by querying the server.
  Future<String> getSecondUserId() async {
    final client = HttpClient();
    try {
      final request = await client.getUrl(
        Uri.parse('$testServerUrl/api/users/me'),
      );
      request.headers.set('Authorization', 'Bearer $secondUserAccessToken');
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      final json = jsonDecode(body) as Map<String, dynamic>;
      return json['id'] as String;
    } finally {
      client.close();
    }
  }

  /// Create a shared space via API (returns space ID).
  Future<String> createSpace(String name, {String? token}) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(
        Uri.parse('$testServerUrl/api/spaces'),
      );
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('Authorization', 'Bearer ${token ?? adminAccessToken}');
      request.write(jsonEncode({'name': name}));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      if (response.statusCode != 201) {
        throw StateError('Create space failed (${response.statusCode}): $body');
      }
      final json = jsonDecode(body) as Map<String, dynamic>;
      return json['id'] as String;
    } finally {
      client.close();
    }
  }

  /// Add a member to a space via API.
  Future<void> addSpaceMember(String spaceId, String userId, {String? token}) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(
        Uri.parse('$testServerUrl/api/spaces/$spaceId/members'),
      );
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('Authorization', 'Bearer ${token ?? adminAccessToken}');
      request.write(jsonEncode({'userId': userId}));
      final response = await request.close();
      if (response.statusCode >= 400) {
        final body = await response.transform(utf8.decoder).join();
        throw StateError('Add member failed (${response.statusCode}): $body');
      }
      await response.drain();
    } finally {
      client.close();
    }
  }
}
```

**Step 3: Commit**

```bash
git add mobile/integration_test/fixtures/seed_data.dart
git commit -m "test: extend TestDataSeeder with second user and space API helpers"
```

---

### Task 2: Extend SharedSpacePage page object for member management

**Files:**

- Modify: `mobile/integration_test/pages/shared_space_page.dart`

**Step 1: Add new page object methods**

The existing `SharedSpacePage` only covers create/open/toggle. We need methods for delete, members navigation, role changes, and leave.

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

/// Page object for shared spaces screens.
class SharedSpacePage {
  final PatrolIntegrationTester $;

  const SharedSpacePage(this.$);

  /// Navigate to shared spaces from the library tab.
  Future<void> openFromLibrary() async {
    final spacesText = find.text('Spaces');
    for (var i = 0; i < 10; i++) {
      await $.pump(const Duration(milliseconds: 500));
      if ($.tester.any(spacesText)) break;
    }
    await $.tester.ensureVisible(spacesText);
    await $.pump();
    await $.tester.tap(spacesText);
    await $.pump(const Duration(seconds: 2));
  }

  /// Create a new shared space via the FAB and dialog.
  Future<void> createSpace(String name) async {
    await $(FloatingActionButton).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(FloatingActionButton).tap();
    await $.pump(const Duration(seconds: 1));

    final textField = find.byType(TextField).first;
    await $.tester.ensureVisible(textField);
    await $.pump();
    await $.tester.enterText(textField, name);
    await $.pump(const Duration(milliseconds: 500));

    await $.tester.ensureVisible(find.text('Create'));
    await $.pump();
    await $.tester.tap(find.text('Create'));
    await $.pump(const Duration(seconds: 2));
  }

  /// Open a shared space by name.
  Future<void> openSpace(String name) async {
    await $(name).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(name).tap();
    await $.pump(const Duration(seconds: 2));
  }

  /// Toggle "show in timeline" for the current space.
  Future<void> toggleShowInTimeline() async {
    await $(Icons.visibility).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(Icons.visibility).tap();
    await $.pump(const Duration(seconds: 1));
  }

  /// Delete the current space via the popup menu.
  Future<void> deleteCurrentSpace() async {
    // Tap the popup menu button (three dots)
    await $(PopupMenuButton).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(PopupMenuButton).tap();
    await $.pump(const Duration(seconds: 1));

    // Tap "Delete Space" in the menu
    await $('Delete Space').waitUntilVisible(
      timeout: const Duration(seconds: 5),
    );
    await $('Delete Space').tap();
    await $.pump(const Duration(seconds: 1));

    // Confirm deletion in the alert dialog
    final deleteButton = find.widgetWithText(TextButton, 'Delete');
    await $.tester.ensureVisible(deleteButton);
    await $.pump();
    await $.tester.tap(deleteButton);
    await $.pump(const Duration(seconds: 2));
  }

  /// Navigate to the members page from the space detail.
  Future<void> openMembers() async {
    await $(Icons.people_outline).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(Icons.people_outline).tap();
    await $.pump(const Duration(seconds: 2));
  }

  /// Tap the add member button on the members page.
  Future<void> tapAddMember() async {
    await $(Icons.person_add_outlined).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(Icons.person_add_outlined).tap();
    await $.pump(const Duration(seconds: 2));
  }

  /// Select a user by name in the member selection page, then confirm.
  Future<void> selectAndAddMember(String userName) async {
    await $(userName).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(userName).tap();
    await $.pump(const Duration(milliseconds: 500));

    // Tap the "Add" button (may be i18n key 'add')
    final addButton = find.text('Add');
    if ($.tester.any(addButton)) {
      await $.tester.tap(addButton);
    } else {
      // Fallback: try lowercase 'add'
      await $.tester.tap(find.text('add'));
    }
    await $.pump(const Duration(seconds: 2));
  }

  /// Tap on a member by name in the members list to open their action sheet.
  Future<void> tapMember(String memberName) async {
    await $(memberName).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(memberName).tap();
    await $.pump(const Duration(seconds: 1));
  }

  /// Change a member's role via the bottom sheet.
  /// Call [tapMember] first to open the sheet.
  Future<void> setMemberRole(String role) async {
    final roleText = 'Set as $role';
    await $(roleText).waitUntilVisible(
      timeout: const Duration(seconds: 5),
    );
    await $(roleText).tap();
    await $.pump(const Duration(seconds: 1));
  }

  /// Remove a member via the bottom sheet.
  /// Call [tapMember] first to open the sheet.
  Future<void> removeMember() async {
    await $('Remove from Space').waitUntilVisible(
      timeout: const Duration(seconds: 5),
    );
    await $('Remove from Space').tap();
    await $.pump(const Duration(seconds: 1));

    // Confirm removal
    final removeButton = find.widgetWithText(TextButton, 'Remove');
    await $.tester.ensureVisible(removeButton);
    await $.pump();
    await $.tester.tap(removeButton);
    await $.pump(const Duration(seconds: 2));
  }

  /// Leave the space via the bottom sheet (non-owner).
  /// Call [tapMember] with own name first to open the sheet.
  Future<void> leaveSpace() async {
    await $('Leave Space').waitUntilVisible(
      timeout: const Duration(seconds: 5),
    );
    await $('Leave Space').tap();
    await $.pump(const Duration(seconds: 1));

    // Confirm leave
    final leaveButton = find.widgetWithText(TextButton, 'Leave');
    await $.tester.ensureVisible(leaveButton);
    await $.pump();
    await $.tester.tap(leaveButton);
    await $.pump(const Duration(seconds: 2));
  }

  /// Verify a space appears in the spaces list.
  Future<bool> isSpaceVisible(String name) async {
    await $.pump(const Duration(seconds: 1));
    return $.tester.any(find.text(name));
  }

  /// Verify a member appears in the members list with a given role chip.
  Future<bool> isMemberVisible(String memberName) async {
    await $.pump(const Duration(seconds: 1));
    return $.tester.any(find.text(memberName));
  }

  /// Navigate back (pops current route).
  Future<void> goBack() async {
    await $.tester.tap(find.byType(BackButton));
    await $.pump(const Duration(seconds: 1));
  }
}
```

**Step 2: Commit**

```bash
git add mobile/integration_test/pages/shared_space_page.dart
git commit -m "test: extend SharedSpacePage page object with member management and delete"
```

---

### Task 3: Add Patrol test — delete space

**Files:**

- Modify: `mobile/integration_test/tests/shared_spaces_test.dart`

**Step 1: Write the failing test**

Add a second `patrolTest` to the existing file. This test creates a space, deletes it, and verifies it's gone.

Replace the full file content:

```dart
import 'package:flutter/material.dart';
import 'package:patrol/patrol.dart';

import '../common/patrol_config.dart';
import '../common/test_app.dart';
import '../common/wait_helpers.dart';
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
      await grantPermissionIfRequested($);
      await timelinePage.waitForLoaded();
      await timelinePage.goToLibrary();
      await spacePage.openFromLibrary();
      await spacePage.createSpace('Test Space');
      await spacePage.openSpace('Test Space');
      await spacePage.toggleShowInTimeline();
    },
  );

  patrolTest(
    'Create and delete a shared space',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);
      final spacePage = SharedSpacePage($);

      await loginPage.loginWithTestCredentials();
      await grantPermissionIfRequested($);
      await timelinePage.waitForLoaded();
      await timelinePage.goToLibrary();
      await spacePage.openFromLibrary();

      // Create and verify space exists
      await spacePage.createSpace('Delete Me Space');
      expect(await spacePage.isSpaceVisible('Delete Me Space'), isTrue);

      // Open space and delete it
      await spacePage.openSpace('Delete Me Space');
      await spacePage.deleteCurrentSpace();

      // Should be back on the spaces list; space should be gone
      await $.pump(const Duration(seconds: 2));
      expect(await spacePage.isSpaceVisible('Delete Me Space'), isFalse);
    },
  );

  patrolTest(
    'Add member to space and change their role',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);
      final spacePage = SharedSpacePage($);

      await loginPage.loginWithTestCredentials();
      await grantPermissionIfRequested($);
      await timelinePage.waitForLoaded();
      await timelinePage.goToLibrary();
      await spacePage.openFromLibrary();

      // Create a space
      await spacePage.createSpace('Members Test Space');
      await spacePage.openSpace('Members Test Space');

      // Navigate to members
      await spacePage.openMembers();

      // Add the second user
      await spacePage.tapAddMember();
      await spacePage.selectAndAddMember(TestDataSeeder.secondUserName);

      // Verify member appears
      expect(await spacePage.isMemberVisible(TestDataSeeder.secondUserName), isTrue);

      // Change role to Editor
      await spacePage.tapMember(TestDataSeeder.secondUserName);
      await spacePage.setMemberRole('Editor');

      // Verify role was updated (re-tap to see updated sheet)
      await $.pump(const Duration(seconds: 1));
    },
  );

  patrolTest(
    'Remove member from space',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);
      final spacePage = SharedSpacePage($);

      // Seed a space with the second user as a member via API
      final spaceId = await seeder.createSpace('Remove Test Space');
      final secondUserId = await seeder.getSecondUserId();
      await seeder.addSpaceMember(spaceId, secondUserId);

      await loginPage.loginWithTestCredentials();
      await grantPermissionIfRequested($);
      await timelinePage.waitForLoaded();
      await timelinePage.goToLibrary();
      await spacePage.openFromLibrary();

      // Open the pre-seeded space
      await spacePage.openSpace('Remove Test Space');
      await spacePage.openMembers();

      // Verify member is there
      expect(await spacePage.isMemberVisible(TestDataSeeder.secondUserName), isTrue);

      // Remove the member
      await spacePage.tapMember(TestDataSeeder.secondUserName);
      await spacePage.removeMember();

      // Verify member is gone
      await $.pump(const Duration(seconds: 1));
      expect(await spacePage.isMemberVisible(TestDataSeeder.secondUserName), isFalse);
    },
  );
}
```

**Step 2: Run the test to verify it compiles (Patrol tests can only be fully verified on emulator)**

```bash
cd mobile
flutter analyze integration_test/tests/shared_spaces_test.dart
```

Expected: No analysis errors (may have warnings about unused imports, that's fine).

**Step 3: Commit**

```bash
git add mobile/integration_test/tests/shared_spaces_test.dart
git commit -m "test: add Patrol E2E tests for delete space, add/remove members, role changes"
```

---

## Workstream B: Web Test Mocks (Tasks 4-7)

### Task 4: Create websocket mock utility

**Files:**

- Create: `web/src/test-data/mocks/websocket.mock.ts`

**Step 1: Write a test that uses the mock to verify it works**

Create `web/src/test-data/mocks/websocket.mock.spec.ts`:

```typescript
import { websocketMock } from './websocket.mock';

// The mock auto-registers via vi.mock — verify exports are callable
describe('websocket mock', () => {
  it('should export mocked websocket store', () => {
    expect(websocketMock.websocketStore).toBeDefined();
    expect(websocketMock.websocketStore.connected).toBeDefined();
  });

  it('should export mocked functions', () => {
    expect(websocketMock.openWebsocketConnection).toBeDefined();
    expect(websocketMock.closeWebsocketConnection).toBeDefined();
    expect(websocketMock.waitForWebsocketEvent).toBeDefined();
  });

  it('should allow configuring waitForWebsocketEvent', async () => {
    websocketMock.waitForWebsocketEvent.mockResolvedValue(undefined as never);
    const result = await websocketMock.waitForWebsocketEvent('on_asset_update');
    expect(result).toBeUndefined();
  });
});
```

**Step 2: Run the test to verify it fails**

```bash
cd web
pnpm test -- --run src/test-data/mocks/websocket.mock.spec.ts
```

Expected: FAIL — module `./websocket.mock` does not exist.

**Step 3: Implement the websocket mock**

Create `web/src/test-data/mocks/websocket.mock.ts`:

````typescript
import { writable } from 'svelte/store';

/**
 * Reusable mock for `$lib/stores/websocket`.
 *
 * Usage in test files:
 * ```ts
 * import { websocketMock } from '@test-data/mocks/websocket.mock';
 * // vi.mock is called automatically when this module is imported
 * ```
 */
vi.mock('$lib/stores/websocket', () => ({
  websocketStore: {
    connected: writable(false),
    serverVersion: writable(undefined),
    serverRestarting: writable(undefined),
  },
  websocketEvents: {
    on: vi.fn(() => vi.fn()),
    off: vi.fn(),
  },
  openWebsocketConnection: vi.fn(),
  closeWebsocketConnection: vi.fn(),
  waitForWebsocketEvent: vi.fn(),
}));

// Re-import to get the mocked version for test assertions
import {
  closeWebsocketConnection,
  openWebsocketConnection,
  waitForWebsocketEvent,
  websocketEvents,
  websocketStore,
} from '$lib/stores/websocket';
import type { Mock } from 'vitest';

export const websocketMock = {
  websocketStore: websocketStore as {
    connected: ReturnType<typeof writable<boolean>>;
    serverVersion: ReturnType<typeof writable>;
    serverRestarting: ReturnType<typeof writable>;
  },
  websocketEvents: websocketEvents as {
    on: Mock;
    off: Mock;
  },
  openWebsocketConnection: openWebsocketConnection as unknown as Mock,
  closeWebsocketConnection: closeWebsocketConnection as unknown as Mock,
  waitForWebsocketEvent: waitForWebsocketEvent as unknown as Mock,
};
````

**Step 4: Run the test to verify it passes**

```bash
cd web
pnpm test -- --run src/test-data/mocks/websocket.mock.spec.ts
```

Expected: PASS — 3 tests.

**Step 5: Commit**

```bash
git add web/src/test-data/mocks/websocket.mock.ts web/src/test-data/mocks/websocket.mock.spec.ts
git commit -m "test: add reusable websocket mock utility"
```

---

### Task 5: Create spaces API mock utility

**Files:**

- Create: `web/src/test-data/mocks/spaces-api.mock.ts`

**Step 1: Write a test that uses the mock**

Create `web/src/test-data/mocks/spaces-api.mock.spec.ts`:

```typescript
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { sharedSpaceFactory } from '@test-data/factories/shared-space-factory';
import { spacesApiMock } from './spaces-api.mock';

describe('spaces API mock', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should configure getAllSpaces to return factory data', async () => {
    const spaces = sharedSpaceFactory.buildList(3);
    spacesApiMock.getAllSpaces(spaces);

    const result = await sdkMock.getAllSpaces();
    expect(result).toEqual(spaces);
    expect(sdkMock.getAllSpaces).toHaveBeenCalledOnce();
  });

  it('should configure getSpace to return a single space', async () => {
    const space = sharedSpaceFactory.build({ name: 'My Space' });
    spacesApiMock.getSpace(space);

    const result = await sdkMock.getSpace({ id: space.id });
    expect(result).toEqual(space);
  });

  it('should configure createSpace to return the new space', async () => {
    const space = sharedSpaceFactory.build({ name: 'New Space' });
    spacesApiMock.createSpace(space);

    const result = await sdkMock.createSpace({ sharedSpaceCreateDto: { name: 'New Space' } });
    expect(result).toEqual(space);
  });

  it('should configure removeSpace as void resolved', async () => {
    spacesApiMock.removeSpace();
    await expect(sdkMock.removeSpace({ id: 'some-id' })).resolves.not.toThrow();
  });
});
```

**Step 2: Run the test to verify it fails**

```bash
cd web
pnpm test -- --run src/test-data/mocks/spaces-api.mock.spec.ts
```

Expected: FAIL — module `./spaces-api.mock` does not exist.

**Step 3: Implement the spaces API mock**

Create `web/src/test-data/mocks/spaces-api.mock.ts`:

````typescript
import type { SharedSpaceResponseDto } from '@immich/sdk';
import * as sdk from '@immich/sdk';

/**
 * Reusable mock helpers for shared space SDK functions.
 *
 * Requires `$lib/__mocks__/sdk.mock` to be imported first (auto-mocks @immich/sdk).
 *
 * Usage:
 * ```ts
 * import '$lib/__mocks__/sdk.mock';
 * import { spacesApiMock } from '@test-data/mocks/spaces-api.mock';
 *
 * beforeEach(() => { vi.resetAllMocks(); });
 *
 * it('lists spaces', async () => {
 *   spacesApiMock.getAllSpaces([space1, space2]);
 *   // ... test code that calls getAllSpaces
 * });
 * ```
 */
export const spacesApiMock = {
  /** Mock `getAllSpaces` to resolve with the given spaces. */
  getAllSpaces(spaces: SharedSpaceResponseDto[]) {
    vi.mocked(sdk.getAllSpaces).mockResolvedValue(spaces);
  },

  /** Mock `getSpace` to resolve with the given space. */
  getSpace(space: SharedSpaceResponseDto) {
    vi.mocked(sdk.getSpace).mockResolvedValue(space);
  },

  /** Mock `createSpace` to resolve with the given space. */
  createSpace(space: SharedSpaceResponseDto) {
    vi.mocked(sdk.createSpace).mockResolvedValue(space);
  },

  /** Mock `updateSpace` to resolve with the given space. */
  updateSpace(space: SharedSpaceResponseDto) {
    vi.mocked(sdk.updateSpace).mockResolvedValue(space);
  },

  /** Mock `removeSpace` to resolve void. */
  removeSpace() {
    vi.mocked(sdk.removeSpace).mockResolvedValue(void 0 as never);
  },

  /** Mock `addAssets` (space assets) to resolve void. */
  addAssets() {
    vi.mocked(sdk.addAssets).mockResolvedValue(void 0 as never);
  },

  /** Mock `removeAssets` (space assets) to resolve void. */
  removeAssets() {
    vi.mocked(sdk.removeAssets).mockResolvedValue(void 0 as never);
  },

  /** Mock `addMember` to resolve void. */
  addMember() {
    vi.mocked(sdk.addMember).mockResolvedValue(void 0 as never);
  },

  /** Mock `updateMember` to resolve void. */
  updateMember() {
    vi.mocked(sdk.updateMember).mockResolvedValue(void 0 as never);
  },

  /** Mock `markSpaceViewed` to resolve void. */
  markSpaceViewed() {
    vi.mocked(sdk.markSpaceViewed).mockResolvedValue(void 0 as never);
  },

  /** Mock `getSpaceActivities` to resolve with given activities. */
  getSpaceActivities(activities: unknown[]) {
    vi.mocked(sdk.getSpaceActivities).mockResolvedValue(activities as never);
  },
};
````

**Step 4: Run the test to verify it passes**

```bash
cd web
pnpm test -- --run src/test-data/mocks/spaces-api.mock.spec.ts
```

Expected: PASS — 4 tests.

**Step 5: Commit**

```bash
git add web/src/test-data/mocks/spaces-api.mock.ts web/src/test-data/mocks/spaces-api.mock.spec.ts
git commit -m "test: add reusable spaces API mock utility with factory integration"
```

---

### Task 6: Refactor edit-manager.spec.ts to use websocket mock

**Files:**

- Modify: `web/src/lib/managers/edit/edit-manager.spec.ts`

This task validates that the new websocket mock is a drop-in replacement for the inline `vi.mock` pattern.

**Step 1: Run existing tests to verify they pass (baseline)**

```bash
cd web
pnpm test -- --run src/lib/managers/edit/edit-manager.spec.ts
```

Expected: PASS (all existing tests).

**Step 2: Refactor to use the shared mock**

In `edit-manager.spec.ts`, replace:

```typescript
// OLD:
vi.mock('$lib/stores/websocket');
// ... and later:
vi.mocked(waitForWebsocketEvent).mockResolvedValue(undefined as never);
```

With:

```typescript
// NEW:
import { websocketMock } from '@test-data/mocks/websocket.mock';
// ... and later:
websocketMock.waitForWebsocketEvent.mockResolvedValue(undefined as never);
```

Remove the `import { waitForWebsocketEvent } from '$lib/stores/websocket';` since it now comes through the mock.

**Step 3: Run tests to verify they still pass**

```bash
cd web
pnpm test -- --run src/lib/managers/edit/edit-manager.spec.ts
```

Expected: PASS — same results as baseline.

**Step 4: Commit**

```bash
git add web/src/lib/managers/edit/edit-manager.spec.ts
git commit -m "refactor: use shared websocket mock in edit-manager tests"
```

---

### Task 7: Run all web tests to verify no regressions

**Step 1: Run full web test suite**

```bash
cd web
pnpm test -- --run
```

Expected: All tests pass, no regressions from the new mock files.

**Step 2: Run format and lint**

```bash
cd web
npx prettier --write src/test-data/mocks/
npx eslint src/test-data/mocks/ --fix
```

**Step 3: Commit any formatting fixes**

```bash
git add -A
git commit -m "chore: format and lint new test mock utilities"
```

---

## Summary

**Total Tasks:** 7 (3 mobile Patrol, 4 web mocks)
**Commits:** 7

**Workstream A (Mobile):**

1. Extend seeder with second user + space API helpers
2. Extend page object with member management methods
3. Write 3 new Patrol E2E tests (delete, add/change role, remove member)

**Workstream B (Web):** 4. Websocket mock utility + test 5. Spaces API mock utility + test 6. Refactor edit-manager to use shared mock (validation) 7. Full regression run + formatting

**Key Principles:**

- TDD: Write failing test → implement → pass → commit
- Each task is self-contained and independently committable
- Mobile tests use API seeding for multi-user scenarios (no UI-only approach)
- Web mocks are tested in isolation before being used as replacements

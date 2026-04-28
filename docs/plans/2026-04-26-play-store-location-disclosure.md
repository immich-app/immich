# Play Store Location Disclosure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Android location permission disclosures explicit enough for Google Play's prominent disclosure requirement.

**Architecture:** Keep the existing map and automatic endpoint switching features. Update the English source copy, regenerate mobile localization files, and adjust the networking permission flow so users can decline before any runtime permission request. The map permission flow already gates the runtime request behind user confirmation; this plan also makes dialog dismissal safely count as decline.

**Tech Stack:** Flutter/Dart, hooks_riverpod, easy_localization, geolocator, permission_handler, Flutter widget tests, mocktail, Drift in-memory test store.

---

## File Structure

- Modify `i18n/en.json`: source English disclosure copy for map, foreground location, and background location.
- Modify generated `mobile/lib/generated/codegen_loader.g.dart`: easy_localization loader output containing updated English strings.
- Modify generated `mobile/lib/generated/translations.g.dart`: generated key accessor file after running translation codegen.
- Modify `mobile/lib/widgets/settings/networking_settings/networking_settings.dart`: add decline actions and stop the background permission flow unless foreground location was already granted or explicitly granted.
- Modify `mobile/lib/presentation/widgets/map/map_utils.dart`: use a typed `showDialog<bool>` and treat dismissal as a declined prominent disclosure.
- Modify `mobile/lib/utils/map_utils.dart`: mirror the typed map permission dialog fix in the legacy map utility.
- Create `mobile/test/policy/location_disclosure_copy_test.dart`: tests the source English disclosure copy contains explicit location access and usage language.
- Create `mobile/test/widgets/settings/networking_settings_test.dart`: tests the networking permission disclosure decline behavior.

## Task 1: Add Failing Policy Copy Test

**Files:**

- Create: `mobile/test/policy/location_disclosure_copy_test.dart`

- [ ] **Step 1: Write the failing copy test**

Create `mobile/test/policy/location_disclosure_copy_test.dart`:

```dart
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  Map<String, dynamic> loadEnglishTranslations() {
    final file = File('../i18n/en.json');
    return jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  }

  test('map disclosure explains precise current location usage', () {
    final translations = loadEnglishTranslations();
    final content = translations['map_no_location_permission_content'] as String;

    expect(content, contains('precise current location'));
    expect(content, contains('center the map'));
    expect(content, contains('current area'));
    expect(content, contains('not stored or shared'));
  });

  test('automatic endpoint disclosures explain Wi-Fi location permission usage', () {
    final translations = loadEnglishTranslations();
    final foreground = translations['location_permission_content'] as String;
    final background = translations['background_location_permission_content'] as String;

    expect(foreground, contains('precise location'));
    expect(foreground, contains('Wi-Fi network name'));
    expect(foreground, contains('automatic server switching'));
    expect(foreground, contains('not stored or shared'));

    expect(background, contains('background location'));
    expect(background, contains('Wi-Fi network name'));
    expect(background, contains('automatic server switching'));
    expect(background, contains('not stored or shared'));
  });
}
```

- [ ] **Step 2: Run the copy test to verify it fails**

Run:

```bash
cd mobile
mise exec -- flutter test test/policy/location_disclosure_copy_test.dart
```

Expected: FAIL because the current `i18n/en.json` strings do not contain the required phrases such as `precise current location` and `not stored or shared`.

## Task 2: Add Failing Networking Consent Widget Tests

**Files:**

- Create: `mobile/test/widgets/settings/networking_settings_test.dart`

- [ ] **Step 1: Write the failing networking widget tests**

Create `mobile/test/widgets/settings/networking_settings_test.dart`:

```dart
import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/repositories/network.repository.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';
import 'package:immich_mobile/services/network.service.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/networking_settings.dart';
import 'package:mocktail/mocktail.dart';

import '../../test_utils.dart';
import '../../widget_tester_extensions.dart';

class MockNetworkRepository extends Mock implements NetworkRepository {}

class MockPermissionRepository extends Mock implements IPermissionRepository {}

void main() {
  late Drift db;
  late MockNetworkRepository networkRepository;
  late MockPermissionRepository permissionRepository;
  late NetworkService networkService;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    TestUtils.init();
    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
  });

  setUp(() async {
    await Store.clear();
    await Store.put(StoreKey.autoEndpointSwitching, true);

    networkRepository = MockNetworkRepository();
    permissionRepository = MockPermissionRepository();
    networkService = NetworkService(networkRepository, permissionRepository);
  });

  tearDownAll(() async {
    await Store.clear();
    await db.close();
  });

  testWidgets('foreground location disclosure can be declined before requesting permission', (tester) async {
    when(() => permissionRepository.hasLocationWhenInUsePermission()).thenAnswer((_) async => false);
    when(() => permissionRepository.hasLocationAlwaysPermission()).thenAnswer((_) async => false);

    await tester.pumpConsumerWidget(
      const NetworkingSettings(),
      overrides: [networkServiceProvider.overrideWithValue(networkService)],
    );
    await tester.pumpAndSettle();

    expect(find.text('location_permission'), findsOneWidget);
    expect(find.text('cancel'), findsOneWidget);
    expect(find.text('grant_permission'), findsOneWidget);

    await tester.tap(find.text('cancel'));
    await tester.pumpAndSettle();

    verifyNever(() => permissionRepository.requestLocationWhenInUsePermission());
    verifyNever(() => permissionRepository.requestLocationAlwaysPermission());
    verifyNever(() => permissionRepository.openSettings());
    expect(find.text('background_location_permission'), findsNothing);
  });

  testWidgets('background location disclosure can be declined without opening settings', (tester) async {
    when(() => permissionRepository.hasLocationWhenInUsePermission()).thenAnswer((_) async => true);
    when(() => permissionRepository.hasLocationAlwaysPermission()).thenAnswer((_) async => false);

    await tester.pumpConsumerWidget(
      const NetworkingSettings(),
      overrides: [networkServiceProvider.overrideWithValue(networkService)],
    );
    await tester.pumpAndSettle();

    expect(find.text('background_location_permission'), findsOneWidget);
    expect(find.text('cancel'), findsOneWidget);
    expect(find.text('grant_permission'), findsOneWidget);

    await tester.tap(find.text('cancel'));
    await tester.pumpAndSettle();

    verifyNever(() => permissionRepository.requestLocationAlwaysPermission());
    verifyNever(() => permissionRepository.openSettings());
  });
}
```

- [ ] **Step 2: Run the widget tests to verify they fail**

Run:

```bash
cd mobile
mise exec -- flutter test test/widgets/settings/networking_settings_test.dart
```

Expected: FAIL because the current networking permission dialogs do not render a `cancel` action and the foreground decline path is not implemented.

## Task 3: Update Source Disclosure Copy and Regenerate Localization

**Files:**

- Modify: `i18n/en.json`
- Modify: `mobile/lib/generated/codegen_loader.g.dart`
- Modify: `mobile/lib/generated/translations.g.dart`

- [ ] **Step 1: Update the English source strings**

In `i18n/en.json`, replace the three values exactly:

```json
"background_location_permission_content": "Noodle Gallery uses background location to keep reading the Wi-Fi network name while automatic server switching runs in the background. Location data is not stored or shared.",
"location_permission_content": "Noodle Gallery uses your precise location to read the current Wi-Fi network name for automatic server switching. Location data is not stored or shared.",
"map_no_location_permission_content": "Noodle Gallery uses your precise current location to center the map and show photos and videos from your current area. Location data is not stored or shared. Do you want to allow location access now?",
```

- [ ] **Step 2: Regenerate mobile localization files**

Run:

```bash
cd mobile
mise exec -- dart run easy_localization:generate -S ../i18n
mise exec -- dart run bin/generate_keys.dart
mise exec -- dart format lib/generated/codegen_loader.g.dart lib/generated/translations.g.dart
```

Expected: `mobile/lib/generated/codegen_loader.g.dart` updates with the new English copy. `mobile/lib/generated/translations.g.dart` may change formatting or remain unchanged, but include it if Git reports a diff.

- [ ] **Step 3: Run the policy copy test to verify it passes**

Run:

```bash
cd mobile
mise exec -- flutter test test/policy/location_disclosure_copy_test.dart
```

Expected: PASS.

## Task 4: Implement Networking Permission Decline Flow

**Files:**

- Modify: `mobile/lib/widgets/settings/networking_settings/networking_settings.dart`
- Test: `mobile/test/widgets/settings/networking_settings_test.dart`

- [ ] **Step 1: Replace `checkWifiReadPermission()` with explicit foreground/background consent handling**

In `mobile/lib/widgets/settings/networking_settings/networking_settings.dart`, replace the current `checkWifiReadPermission()` function body with:

```dart
    Future<void> checkWifiReadPermission() async {
      final [hasLocationInUse, hasLocationAlways] = await Future.wait([
        ref.read(networkProvider.notifier).getWifiReadPermission(),
        ref.read(networkProvider.notifier).getWifiReadBackgroundPermission(),
      ]);

      var canRequestBackgroundLocation = hasLocationInUse;

      if (!hasLocationInUse) {
        final isGrantLocationInUsePermission = await showDialog<bool>(
          context: context,
          builder: (context) {
            return AlertDialog(
              title: Text("location_permission".tr()),
              content: Text("location_permission_content".tr()),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text("cancel".tr()),
                ),
                TextButton(
                  onPressed: () async {
                    final isGrant = await ref.read(networkProvider.notifier).requestWifiReadPermission();

                    Navigator.pop(context, isGrant);
                  },
                  child: Text("grant_permission".tr()),
                ),
              ],
            );
          },
        );

        canRequestBackgroundLocation = isGrantLocationInUsePermission ?? false;
      }

      if (!canRequestBackgroundLocation) {
        return;
      }

      bool? isGrantLocationAlwaysPermission;

      if (!hasLocationAlways) {
        isGrantLocationAlwaysPermission = await showDialog<bool>(
          context: context,
          builder: (context) {
            return AlertDialog(
              title: Text("background_location_permission".tr()),
              content: Text("background_location_permission_content".tr()),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text("cancel".tr()),
                ),
                TextButton(
                  onPressed: () async {
                    final isGrant = await ref.read(networkProvider.notifier).requestWifiReadBackgroundPermission();

                    Navigator.pop(context, isGrant);
                  },
                  child: Text("grant_permission".tr()),
                ),
              ],
            );
          },
        );
      }

      if (isGrantLocationAlwaysPermission != null && !isGrantLocationAlwaysPermission) {
        await ref.read(networkProvider.notifier).openSettings();
      }
    }
```

- [ ] **Step 2: Run the networking widget tests to verify they pass**

Run:

```bash
cd mobile
mise exec -- flutter test test/widgets/settings/networking_settings_test.dart
```

Expected: PASS.

## Task 5: Harden Map Permission Dialog Dismissal

**Files:**

- Modify: `mobile/lib/presentation/widgets/map/map_utils.dart`
- Modify: `mobile/lib/utils/map_utils.dart`

- [ ] **Step 1: Update the new presentation map utility**

In `mobile/lib/presentation/widgets/map/map_utils.dart`, replace:

```dart
        shouldRequestPermission = await showDialog(
          context: context,
          builder: (context) => _LocationPermissionDisabledDialog(context),
        );
```

with:

```dart
        shouldRequestPermission =
            await showDialog<bool>(
              context: context,
              builder: (context) => _LocationPermissionDisabledDialog(context),
            ) ??
            false;
```

- [ ] **Step 2: Update the legacy map utility**

In `mobile/lib/utils/map_utils.dart`, replace:

```dart
        shouldRequestPermission = await showDialog(
          context: context,
          builder: (context) => _LocationPermissionDisabledDialog(),
        );
```

with:

```dart
        shouldRequestPermission =
            await showDialog<bool>(
              context: context,
              builder: (context) => _LocationPermissionDisabledDialog(),
            ) ??
            false;
```

- [ ] **Step 3: Format the touched Dart files**

Run:

```bash
cd mobile
mise exec -- dart format lib/widgets/settings/networking_settings/networking_settings.dart lib/presentation/widgets/map/map_utils.dart lib/utils/map_utils.dart test/widgets/settings/networking_settings_test.dart test/policy/location_disclosure_copy_test.dart
```

Expected: formatter completes successfully.

## Task 6: Verify and Commit Implementation

**Files:**

- Verify all changed files from Tasks 1-5.

- [ ] **Step 1: Run focused tests**

Run:

```bash
cd mobile
mise exec -- flutter test test/policy/location_disclosure_copy_test.dart test/widgets/settings/networking_settings_test.dart
```

Expected: PASS.

- [ ] **Step 2: Run a nearby existing mobile test**

Run:

```bash
cd mobile
mise exec -- flutter test test/services/map_service_test.dart
```

Expected: PASS.

- [ ] **Step 3: Run Dart analysis on the touched app code**

Run:

```bash
cd mobile
mise exec -- dart analyze --fatal-infos lib/widgets/settings/networking_settings/networking_settings.dart lib/presentation/widgets/map/map_utils.dart lib/utils/map_utils.dart test/widgets/settings/networking_settings_test.dart test/policy/location_disclosure_copy_test.dart
```

Expected: no issues for the touched files. If analyzer reports generated-file or unrelated whole-package issues, capture the exact output and run the focused tests from Steps 1-2 again before reporting the residual risk.

- [ ] **Step 4: Review Git diff**

Run:

```bash
git diff -- i18n/en.json mobile/lib/generated/codegen_loader.g.dart mobile/lib/generated/translations.g.dart mobile/lib/widgets/settings/networking_settings/networking_settings.dart mobile/lib/presentation/widgets/map/map_utils.dart mobile/lib/utils/map_utils.dart mobile/test/policy/location_disclosure_copy_test.dart mobile/test/widgets/settings/networking_settings_test.dart
```

Expected: diff contains only disclosure copy, generated localization output, networking consent flow changes, map dialog typed dismissal handling, and the two tests.

- [ ] **Step 5: Commit implementation**

Run:

```bash
git add i18n/en.json mobile/lib/generated/codegen_loader.g.dart mobile/lib/generated/translations.g.dart mobile/lib/widgets/settings/networking_settings/networking_settings.dart mobile/lib/presentation/widgets/map/map_utils.dart mobile/lib/utils/map_utils.dart mobile/test/policy/location_disclosure_copy_test.dart mobile/test/widgets/settings/networking_settings_test.dart
git commit -m "fix(mobile): disclose location usage before permission requests"
```

Expected: commit succeeds with the implementation changes only.

@Tags(['widget'])
library;

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/shared_link.provider.dart';
import 'package:immich_mobile/models/server_info/server_info.model.dart';
import 'package:immich_mobile/models/server_info/server_config.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/models/server_info/server_features.model.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/widgets/shared_link/shared_link_item.dart';
import 'package:mocktail/mocktail.dart';
import 'package:isar/isar.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';

import '../../test_utils.dart';
import '../../widget_tester_extensions.dart';
import '../../fixtures/user.stub.dart';

class MockServerInfoNotifier extends StateNotifier<ServerInfo> with Mock implements ServerInfoNotifier {
  MockServerInfoNotifier() : super(const ServerInfo(
    serverVersion: ServerVersion(major: 0, minor: 0, patch: 0),
    latestVersion: ServerVersion(major: 0, minor: 0, patch: 0),
    serverFeatures: ServerFeatures(map: true, trash: true, oauthEnabled: false, passwordLogin: true),
    serverConfig: ServerConfig(
      trashDays: 30,
      oauthButtonText: '',
      externalDomain: '',
      mapLightStyleUrl: 'https://tiles.immich.cloud/v1/style/light.json',
      mapDarkStyleUrl: 'https://tiles.immich.cloud/v1/style/dark.json',
    ),
    serverDiskInfo: ServerDiskInfo(diskAvailable: "0", diskSize: "0", diskUse: "0", diskUsagePercentage: 0),
    isVersionMismatch: false,
    isNewReleaseAvailable: false,
    versionMismatchErrorMessage: "",
  ));
}

class MockSharedLinksNotifier extends StateNotifier<AsyncValue<List<SharedLink>>> with Mock implements SharedLinksNotifier {
  MockSharedLinksNotifier() : super(const AsyncValue.loading());
}

void main() {
  late MockServerInfoNotifier mockServerInfoNotifier;
  late MockSharedLinksNotifier mockSharedLinksNotifier;
  late List<Override> overrides;
  late String capturedClipboardText;
  late Isar db;

  final sharedLinkWithSlug = SharedLink(
    id: '1',
    title: 'Test Link',
    description: 'Test Description',
    key: 'test-key',
    slug: 'test-slug',
    expiresAt: DateTime.now().add(Duration(days: 1)),
    allowUpload: true,
    allowDownload: true,
    showMetadata: true,
    thumbAssetId: null,
    password: null,
    type: SharedLinkSource.album,
  );

  final sharedLinkWithoutSlug = SharedLink(
    id: '2',
    title: 'Test Link 2',
    description: 'Test Description 2',
    key: 'test-key-2',
    slug: null,
    expiresAt: DateTime.now().add(Duration(days: 1)),
    allowUpload: false,
    allowDownload: false,
    showMetadata: false,
    thumbAssetId: null,
    password: null,
    type: SharedLinkSource.individual,
  );

  setUpAll(() async {
    TestUtils.init();
    db = await TestUtils.initIsar();
    HttpOverrides.global = null;
  });

  setUp(() async {
    await StoreService.init(storeRepository: IsarStoreRepository(db));

    Store.put(StoreKey.currentUser, UserStub.admin);
    Store.put(StoreKey.serverEndpoint, 'http://example.com');
    Store.put(StoreKey.accessToken, 'test-token');
    Store.put(StoreKey.serverUrl, 'http://example.com');

    mockServerInfoNotifier = MockServerInfoNotifier();
    mockSharedLinksNotifier = MockSharedLinksNotifier();
    capturedClipboardText = '';

    final mockServerInfo = const ServerInfo(
      serverVersion: ServerVersion(major: 1, minor: 0, patch: 0),
      latestVersion: ServerVersion(major: 1, minor: 0, patch: 0),
      serverFeatures: ServerFeatures(map: true, trash: true, oauthEnabled: false, passwordLogin: true),
      serverConfig: ServerConfig(
        trashDays: 30,
        oauthButtonText: '',
        externalDomain: 'https://example.com',
        mapDarkStyleUrl: 'https://tiles.immich.cloud/v1/style/dark.json',
        mapLightStyleUrl: 'https://tiles.immich.cloud/v1/style/light.json',
      ),
      serverDiskInfo: ServerDiskInfo(diskAvailable: "0", diskSize: "0", diskUse: "0", diskUsagePercentage: 0),
      isVersionMismatch: false,
      isNewReleaseAvailable: false,
      versionMismatchErrorMessage: "",
    );

    mockServerInfoNotifier.state = mockServerInfo;

    mockSharedLinksNotifier.state = const AsyncValue.data([]);

    overrides = [
      serverInfoProvider.overrideWith((ref) => mockServerInfoNotifier),
      sharedLinksStateProvider.overrideWith((ref) => mockSharedLinksNotifier),
    ];

    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(SystemChannels.platform, (methodCall) async {
      if (methodCall.method == 'Clipboard.setData') {
        final data = methodCall.arguments as Map<String, dynamic>;
        capturedClipboardText = data['text'] as String;
        return null;
      }
      return null;
    });
  });

  tearDown(() {
    reset(mockServerInfoNotifier);
    reset(mockSharedLinksNotifier);
    capturedClipboardText = '';
    StoreService.I.dispose();
  });

  group('SharedLinkItem Clipboard Tests', () {
    testWidgets('copy button calls Clipboard.setData with correct URL when slug exists',
        (tester) async {
      await tester.pumpConsumerWidget(
        Scaffold(
          body: SharedLinkItem(sharedLinkWithSlug),
        ),
        overrides: overrides,
      );

      final copyButton = find.byIcon(Icons.copy_outlined);
      expect(copyButton, findsOneWidget);
      await tester.tap(copyButton);
      await tester.pumpAndSettle();

      expect(capturedClipboardText, 'https://example.com/s/test-slug');
    });

    testWidgets('copy button calls Clipboard.setData with correct URL when slug is null',
        (tester) async {
      await tester.pumpConsumerWidget(
        Scaffold(
          body: SharedLinkItem(sharedLinkWithoutSlug),
        ),
        overrides: overrides,
      );

      final copyButton = find.byIcon(Icons.copy_outlined);
      expect(copyButton, findsOneWidget);
      await tester.tap(copyButton);
      await tester.pumpAndSettle();

      expect(capturedClipboardText, 'https://example.com/share/test-key-2');
    });

    testWidgets('copy button handles empty external domain by using server URL', skip: true,
        (tester) async {
      final mockServerInfoWithEmptyDomain = const ServerInfo(
        serverVersion: ServerVersion(major: 1, minor: 0, patch: 0),
        latestVersion: ServerVersion(major: 1, minor: 0, patch: 0),
        serverFeatures: ServerFeatures(map: true, trash: true, oauthEnabled: false, passwordLogin: true),
        serverConfig: ServerConfig(
          trashDays: 30,
          oauthButtonText: '',
          externalDomain: '',
          mapDarkStyleUrl: 'https://tiles.immich.cloud/v1/style/dark.json',
          mapLightStyleUrl: 'https://tiles.immich.cloud/v1/style/light.json',
        ),
        serverDiskInfo: ServerDiskInfo(diskAvailable: "0", diskSize: "0", diskUse: "0", diskUsagePercentage: 0),
        isVersionMismatch: false,
        isNewReleaseAvailable: false,
        versionMismatchErrorMessage: "",
      );

      mockServerInfoNotifier.state = mockServerInfoWithEmptyDomain;

      Store.put(StoreKey.serverEndpoint, 'http://example.com');

      await tester.pumpConsumerWidget(
        Scaffold(
          body: SharedLinkItem(sharedLinkWithSlug),
        ),
        overrides: overrides,
      );

      final copyButton = find.byIcon(Icons.copy_outlined);
      expect(copyButton, findsOneWidget);
      await tester.tap(copyButton);
      await tester.pumpAndSettle();

      expect(capturedClipboardText, isNotEmpty);
      expect(capturedClipboardText, 'http://example.com/s/test-slug');
    });

    testWidgets('copy button shows snackbar on successful copy', (tester) async {
      await tester.pumpConsumerWidget(
        Scaffold(
          body: SharedLinkItem(sharedLinkWithSlug),
        ),
        overrides: overrides,
      );

      final copyButton = find.byIcon(Icons.copy_outlined);
      expect(copyButton, findsOneWidget);
      await tester.tap(copyButton);
      await tester.pumpAndSettle();

      expect(find.textContaining('copied'), findsOneWidget);
    });
  });

  group('SharedLinkItem UI Tests', () {
    testWidgets('renders correctly with all properties', (tester) async {
      await tester.pumpConsumerWidget(
        Scaffold(
          body: SharedLinkItem(sharedLinkWithSlug),
        ),
        overrides: overrides,
      );

      expect(find.text('Test Link'), findsOneWidget);
      expect(find.text('Test Description'), findsOneWidget);
      expect(find.text('upload'), findsOneWidget);
      expect(find.text('download'), findsOneWidget);
      expect(find.text('shared_link_info_chip_metadata'), findsOneWidget);
    });

    testWidgets('renders correctly without optional properties', (tester) async {
      await tester.pumpConsumerWidget(
        Scaffold(
          body: SharedLinkItem(sharedLinkWithoutSlug),
        ),
        overrides: overrides,
      );

      expect(find.text('Test Link 2'), findsOneWidget);
      expect(find.text('Test Description 2'), findsOneWidget);
      expect(find.text('upload'), findsNothing);
      expect(find.text('download'), findsNothing);
      expect(find.text('shared_link_info_chip_metadata'), findsNothing);
    });
  });
}

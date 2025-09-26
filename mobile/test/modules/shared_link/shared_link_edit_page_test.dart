@Tags(['widget'])
library;

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/pages/library/shared_link/shared_link_edit.page.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/services/shared_link.service.dart';

import '../../test_utils.dart';
import 'shared_link_test_utils.dart';

late ClipboardCapturer clipboardCapturer;

void main() {
  late Isar db;
  late MockSharedLinkService mockSharedLinkService;
  late MockServerInfoNotifier mockServerInfoNotifier;
  late ProviderContainer container;

  Future<void> createSharedLink(WidgetTester tester) async {
    await tester.enterText(find.byType(TextField).at(0), 'Test Description');
    await tester.pump();

    final createButton = find.widgetWithText(ElevatedButton, 'create_link');
    await tester.ensureVisible(createButton);
    await tester.tap(createButton);
    await tester.pumpAndSettle();
  }

  Future<void> pumpSharedLinkEditPage(
    WidgetTester tester,
    ProviderContainer container, {
    SharedLink? existingLink,
    List<String>? assetsList,
    String? albumId,
  }) async {
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          home: SharedLinkEditPage(existingLink: existingLink, assetsList: assetsList, albumId: albumId),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  setUpAll(() async {
    TestUtils.init();
    db = await TestUtils.initIsar();
    setupTestViewport();
  });

  setUp(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    EasyLocalization.logger.enableBuildModes = [];

    await StoreService.init(storeRepository: IsarStoreRepository(db));
    await Store.put(StoreKey.serverEndpoint, 'https://demo.immich.app');

    mockSharedLinkService = MockSharedLinkService();
    mockServerInfoNotifier = MockServerInfoNotifier();
    container = ProviderContainer(
      overrides: [
        sharedLinkServiceProvider.overrideWith((ref) => mockSharedLinkService),
        serverInfoProvider.overrideWith((ref) => mockServerInfoNotifier),
      ],
    );

    clipboardCapturer = ClipboardCapturer();
    setupClipboardMock(clipboardCapturer);

    setupDefaultMockResponses(mockSharedLinkService);
  });

  tearDown(() {
    container.dispose();
    cleanupClipboardMock();
    clipboardCapturer.clear();
  });

  group('SharedLinkEditPage Tests', () {
    testWidgets('copies URL with slug to clipboard after link creation', (tester) async {
      await pumpSharedLinkEditPage(tester, container, albumId: 'album-1');
      await createSharedLink(tester);

      final copyButton = find.byIcon(Icons.copy);
      await tester.tap(copyButton);
      await tester.pumpAndSettle();
      expect(clipboardCapturer.text, 'https://demo.immich.app/s/new-slug');
    });

    testWidgets('copies URL without slug to clipboard after link creation', (tester) async {
      setupMockResponseForLinkWithoutSlug(mockSharedLinkService);

      await pumpSharedLinkEditPage(tester, container, albumId: 'album-1');
      await createSharedLink(tester);

      final copyButton = find.byIcon(Icons.copy);
      await tester.tap(copyButton);
      await tester.pumpAndSettle();

      expect(clipboardCapturer.text, 'https://demo.immich.app/share/new-key');
    });

    testWidgets('handles empty external domain by using server endpoint', (tester) async {
      setupEmptyExternalDomain(mockServerInfoNotifier);

      await pumpSharedLinkEditPage(tester, container, albumId: 'album-1');
      await createSharedLink(tester);

      final copyButton = find.byIcon(Icons.copy);
      await tester.tap(copyButton);
      await tester.pumpAndSettle();

      expect(clipboardCapturer.text, 'https://demo.immich.app/s/new-slug');
    });

    testWidgets('uses custom domain when external domain is set', (tester) async {
      final mockServerInfoWithCustomDomain = createMockServerInfo(externalDomain: 'https://custom-immich.com');
      mockServerInfoNotifier.state = mockServerInfoWithCustomDomain;

      await pumpSharedLinkEditPage(tester, container, albumId: 'album-1');
      await createSharedLink(tester);

      final copyButton = find.byIcon(Icons.copy);
      await tester.tap(copyButton);
      await tester.pumpAndSettle();

      expect(clipboardCapturer.text, 'https://custom-immich.com/s/new-slug');
    });
  });
}

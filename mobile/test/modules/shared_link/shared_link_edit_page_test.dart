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
import 'shared_link_mocks.dart';
import 'shared_link_test_utils.dart';

late ClipboardCapturer clipboardCapturer;

void main() {
  late Isar db;
  late SharedLinkServiceMock mockSharedLinkService;
  late MockServerInfoNotifier mockServerInfoNotifier;
  late ProviderContainer container;

  setUpAll(() async {
    TestUtils.init();
    db = await TestUtils.initIsar();
    setupTestViewport();
  });

  setUp(() async {
    await StoreService.init(storeRepository: IsarStoreRepository(db));
    await Store.put(StoreKey.serverEndpoint, 'https://demo.immich.app');

    mockSharedLinkService = SharedLinkServiceMock();
    mockServerInfoNotifier = MockServerInfoNotifier();
    container = ProviderContainer(
      overrides: [
        sharedLinkServiceProvider.overrideWith((ref) => mockSharedLinkService),
        serverInfoProvider.overrideWith((ref) => mockServerInfoNotifier),
      ],
    );

    clipboardCapturer = ClipboardCapturer();
    setupClipboardMock(clipboardCapturer);

    setupMockResponse(mockSharedLinkService, 'new-slug');
  });

  tearDown(() {
    container.dispose();
    cleanupClipboardMock();
    clipboardCapturer.clear();
  });

  group('SharedLinkEditPage Tests', () {
    testWidgets('copies correct URL for links with slug', (tester) async {
      await pumpSharedLinkEditPage(tester, container, albumId: 'album-1');
      await createSharedLink(tester);

      await tester.tap(find.byIcon(Icons.copy));
      await tester.pumpAndSettle();
      expect(clipboardCapturer.text, 'https://demo.immich.app/s/new-slug');
    });

    testWidgets('copies correct URL for links without slug', (tester) async {
      setupMockResponse(mockSharedLinkService, '');

      await pumpSharedLinkEditPage(tester, container, albumId: 'album-1');
      await createSharedLink(tester);

      await tester.tap(find.byIcon(Icons.copy));
      await tester.pumpAndSettle();
      expect(clipboardCapturer.text, 'https://demo.immich.app/share/new-key');
    });

    testWidgets('uses server endpoint when external domain is empty', (tester) async {
      setupServerInfo(mockServerInfoNotifier, '');

      await pumpSharedLinkEditPage(tester, container, albumId: 'album-1');
      await createSharedLink(tester);

      await tester.tap(find.byIcon(Icons.copy));
      await tester.pumpAndSettle();
      expect(clipboardCapturer.text, 'https://demo.immich.app/s/new-slug');
    });

    testWidgets('uses custom external domain when set', (tester) async {
      setupServerInfo(mockServerInfoNotifier, 'https://custom-immich.com');

      await pumpSharedLinkEditPage(tester, container, albumId: 'album-1');
      await createSharedLink(tester);

      await tester.tap(find.byIcon(Icons.copy));
      await tester.pumpAndSettle();
      expect(clipboardCapturer.text, 'https://custom-immich.com/s/new-slug');
    });
  });
}

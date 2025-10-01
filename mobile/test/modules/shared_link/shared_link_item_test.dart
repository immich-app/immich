@Tags(['widget'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:mocktail/mocktail.dart';

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/shared_link.provider.dart';
import 'package:immich_mobile/widgets/shared_link/shared_link_item.dart';

import '../../fixtures/user.stub.dart';
import '../../test_utils.dart';
import '../../widget_tester_extensions.dart';
import 'shared_link_test_utils.dart';

void main() {
  late MockServerInfoNotifier mockServerInfoNotifier;
  late MockSharedLinksNotifier mockSharedLinksNotifier;
  late List<Override> overrides;
  late ClipboardCapturer clipboardCapturer;
  late Isar db;

  final sharedLinkWithSlug = createSharedLinkWithSlug();
  final sharedLinkWithoutSlug = createSharedLinkWithoutSlug();

  setUpAll(() async {
    TestUtils.init();
    db = await TestUtils.initIsar();
  });

  setUp(() async {
    await StoreService.init(storeRepository: IsarStoreRepository(db));

    await Store.put(StoreKey.currentUser, UserStub.admin);
    await Store.put(StoreKey.serverEndpoint, 'http://example.com');
    await Store.put(StoreKey.accessToken, 'test-token');
    await Store.put(StoreKey.serverUrl, 'http://example.com');

    mockServerInfoNotifier = MockServerInfoNotifier();
    mockSharedLinksNotifier = MockSharedLinksNotifier();
    clipboardCapturer = ClipboardCapturer();

    setupServerInfo(mockServerInfoNotifier, 'https://example.com');
    mockSharedLinksNotifier.state = const AsyncValue.data([]);

    overrides = [
      serverInfoProvider.overrideWith((ref) => mockServerInfoNotifier),
      sharedLinksStateProvider.overrideWith((ref) => mockSharedLinksNotifier),
    ];

    setupClipboardMock(clipboardCapturer);

    when(() => mockSharedLinksNotifier.deleteLink(any())).thenAnswer((_) async {});
  });

  tearDown(() {
    reset(mockSharedLinksNotifier);
    cleanupClipboardMock();
    clipboardCapturer.clear();
    StoreService.I.dispose();
  });

  group('SharedLinkItem Tests', () {
    testWidgets('copies URL with slug', (tester) async {
      await tester.pumpConsumerWidget(Scaffold(body: SharedLinkItem(sharedLinkWithSlug)), overrides: overrides);

      await tester.tap(find.byIcon(Icons.copy_outlined));
      await tester.pumpAndSettle();
      expect(clipboardCapturer.text, 'https://example.com/s/test-slug');
    });

    testWidgets('copies URL without slug', (tester) async {
      await tester.pumpConsumerWidget(Scaffold(body: SharedLinkItem(sharedLinkWithoutSlug)), overrides: overrides);

      await tester.tap(find.byIcon(Icons.copy_outlined));
      await tester.pumpAndSettle();
      expect(clipboardCapturer.text, 'https://example.com/share/test-key-2');
    });

    testWidgets('falls back to server URL when external domain is empty', (tester) async {
      setupServerInfo(mockServerInfoNotifier, '');
      await Store.put(StoreKey.serverEndpoint, 'http://example.com');

      await tester.pumpConsumerWidget(Scaffold(body: SharedLinkItem(sharedLinkWithSlug)), overrides: overrides);

      await tester.tap(find.byIcon(Icons.copy_outlined));
      await tester.pumpAndSettle();
      expect(clipboardCapturer.text, 'http://example.com/s/test-slug');
    });

    testWidgets('shows success message on copy', (tester) async {
      await tester.pumpConsumerWidget(Scaffold(body: SharedLinkItem(sharedLinkWithSlug)), overrides: overrides);

      await tester.tap(find.byIcon(Icons.copy_outlined));
      await tester.pumpAndSettle();
      expect(find.textContaining('copied'), findsOneWidget);
    });

    testWidgets('handles different link types correctly', (tester) async {
      await tester.pumpConsumerWidget(Scaffold(body: SharedLinkItem(sharedLinkWithSlug)), overrides: overrides);

      await tester.tap(find.byIcon(Icons.copy_outlined));
      await tester.pumpAndSettle();
      expect(clipboardCapturer.text, 'https://example.com/s/test-slug');

      await tester.pumpConsumerWidget(Scaffold(body: SharedLinkItem(sharedLinkWithoutSlug)), overrides: overrides);
      await tester.tap(find.byIcon(Icons.copy_outlined));
      await tester.pumpAndSettle();
      expect(clipboardCapturer.text, 'https://example.com/share/test-key-2');
    });
  });
}

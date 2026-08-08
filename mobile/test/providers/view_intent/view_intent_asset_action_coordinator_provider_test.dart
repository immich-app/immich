import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/view_intent/active_view_intent_payload_provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_asset_action_coordinator.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_trash_scope.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:mocktail/mocktail.dart';

import '../../unit/factories/local_asset_factory.dart';
import '../../unit/factories/remote_asset_factory.dart';

class _TestViewIntentHandler implements ViewIntentHandler {
  _TestViewIntentHandler({this.reopenResult = true, this.reopenError});

  final bool reopenResult;
  final Object? reopenError;
  final List<String> reopenedRemoteAssetIds = [];

  @override
  Future<void> flushDeferredViewIntent() async {}

  @override
  Future<void> handle(ViewIntentPayload payload) async {}

  @override
  void init() {}

  @override
  Future<void> onAppResumed() async {}

  @override
  Future<bool> reopenRemoteAsset(String remoteAssetId) async {
    reopenedRemoteAssetIds.add(remoteAssetId);
    if (reopenError case final error?) {
      throw error;
    }
    return reopenResult;
  }
}

class _MockAppRouter extends Mock implements AppRouter {}

class _ViewerNotifier extends AssetViewerStateNotifier {
  _ViewerNotifier(this.asset);

  final BaseAsset asset;

  @override
  AssetViewerState build() {
    super.build();
    return AssetViewerState(currentAsset: asset);
  }
}

typedef _Harness = ({ViewIntentAssetActionCoordinator coordinator, _MockAppRouter router, ProviderContainer scope});

void main() {
  late ProviderContainer container;

  Future<_Harness> pumpHarness(
    WidgetTester tester, {
    required BaseAsset asset,
    required TimelineOrigin origin,
    required _TestViewIntentHandler handler,
    bool activeViewIntent = true,
    bool isTrashScoped = false,
  }) async {
    final timeline = TimelineService((
      assetSource: (_, __) async => [asset],
      bucketSource: () => Stream.value(const [Bucket(assetCount: 1)]),
      origin: origin,
    ));
    addTearDown(timeline.dispose);

    final router = _MockAppRouter();
    when(() => router.maybePop()).thenAnswer((_) async => true);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          timelineServiceProvider.overrideWithValue(timeline),
          assetViewerProvider.overrideWith(() => _ViewerNotifier(asset)),
          viewIntentHandlerProvider.overrideWithValue(handler),
          appRouterProvider.overrideWithValue(router),
        ],
        child: const MaterialApp(
          home: Scaffold(body: Text('root', key: Key('root'))),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final scope = ProviderScope.containerOf(tester.element(find.byKey(const Key('root'))), listen: false);
    scope.read(viewIntentTrashScopeProvider.notifier).set(isTrashScoped);
    if (activeViewIntent) {
      scope
          .read(activeViewIntentPayloadProvider.notifier)
          .setPayload(
            ViewIntentPayload(path: '/tmp/view-intent.jpg', mimeType: 'image/jpeg', localAssetId: asset.localId),
          );
    }

    return (coordinator: scope.read(viewIntentAssetActionCoordinatorProvider), router: router, scope: scope);
  }

  setUp(() {
    container = ProviderContainer();
  });

  tearDown(() {
    container.dispose();
  });

  test('allows timeline deletion for a file-backed view intent', () {
    container.read(viewIntentFilePathProvider.notifier).setPath('/tmp/materialized.jpg');

    final coordinator = container.read(viewIntentAssetActionCoordinatorProvider);

    expect(coordinator.canDelete(ActionSource.timeline), isTrue);
  });

  test('prevents viewer deletion for a file-backed view intent', () {
    container.read(viewIntentFilePathProvider.notifier).setPath('/tmp/materialized.jpg');

    final coordinator = container.read(viewIntentAssetActionCoordinatorProvider);

    expect(coordinator.canDelete(ActionSource.viewer), isFalse);
  });

  test('allows viewer deletion after the file-backed path is cleared', () {
    container.read(viewIntentFilePathProvider.notifier)
      ..setPath('/tmp/materialized.jpg')
      ..clear();

    final coordinator = container.read(viewIntentAssetActionCoordinatorProvider);

    expect(coordinator.canDelete(ActionSource.viewer), isTrue);
  });

  testWidgets('reopens a remote asset after it is moved to trash', (tester) async {
    final asset = RemoteAssetFactory.create();
    final handler = _TestViewIntentHandler();
    final harness = await pumpHarness(tester, asset: asset, origin: TimelineOrigin.deepLink, handler: handler);

    await harness.coordinator.afterDelete(source: ActionSource.viewer, remoteAssetIds: [asset.id], movedToTrash: true);

    expect(handler.reopenedRemoteAssetIds, [asset.id]);
  });

  testWidgets('reopens a restored remote asset from a trash deep link', (tester) async {
    final asset = RemoteAssetFactory.create(deletedAt: DateTime(2026, 8, 4));
    final handler = _TestViewIntentHandler();
    final harness = await pumpHarness(
      tester,
      asset: asset,
      origin: TimelineOrigin.deepLink,
      handler: handler,
      isTrashScoped: true,
    );

    await harness.coordinator.afterRestore(source: ActionSource.viewer, remoteAssetIds: [asset.id]);

    expect(handler.reopenedRemoteAssetIds, [asset.id]);
  });

  testWidgets('closes the viewer after permanently deleting a remote asset', (tester) async {
    final asset = RemoteAssetFactory.create(deletedAt: DateTime(2026, 8, 4));
    final handler = _TestViewIntentHandler();
    final harness = await pumpHarness(tester, asset: asset, origin: TimelineOrigin.deepLink, handler: handler);

    await harness.coordinator.afterDelete(source: ActionSource.viewer, remoteAssetIds: [asset.id], movedToTrash: false);
    verify(() => harness.router.maybePop()).called(1);
  });

  testWidgets('does not apply a completed delete transition to a newer view intent', (tester) async {
    final asset = RemoteAssetFactory.create(deletedAt: DateTime(2026, 8, 4));
    final handler = _TestViewIntentHandler();
    final harness = await pumpHarness(tester, asset: asset, origin: TimelineOrigin.deepLink, handler: handler);
    final newerPayload = ViewIntentPayload(
      path: '/tmp/newer-view-intent.jpg',
      mimeType: 'image/jpeg',
      localAssetId: 'newer-local',
    );
    harness.scope.read(activeViewIntentPayloadProvider.notifier).setPayload(newerPayload);

    await harness.coordinator.afterDelete(source: ActionSource.viewer, remoteAssetIds: [asset.id], movedToTrash: false);

    verifyNever(() => harness.router.maybePop());
    expect(handler.reopenedRemoteAssetIds, isEmpty);
  });

  testWidgets('closes the viewer after deleting a local-only asset', (tester) async {
    final asset = LocalAssetFactory.create();
    final handler = _TestViewIntentHandler();
    final harness = await pumpHarness(tester, asset: asset, origin: TimelineOrigin.deepLink, handler: handler);

    await harness.coordinator.afterDelete(source: ActionSource.viewer, remoteAssetIds: const [], movedToTrash: false);
    verify(() => harness.router.maybePop()).called(1);
  });

  testWidgets('keeps the viewer open after deleting only a remote asset device copy', (tester) async {
    final asset = RemoteAssetFactory.create(localId: 'local');
    final handler = _TestViewIntentHandler();
    final harness = await pumpHarness(tester, asset: asset, origin: TimelineOrigin.deepLink, handler: handler);

    await harness.coordinator.afterDelete(source: ActionSource.viewer, remoteAssetIds: const [], movedToTrash: false);
    verifyNever(() => harness.router.maybePop());
  });

  testWidgets('does nothing for a timeline deletion', (tester) async {
    final asset = RemoteAssetFactory.create();
    final handler = _TestViewIntentHandler();
    final harness = await pumpHarness(tester, asset: asset, origin: TimelineOrigin.deepLink, handler: handler);

    await harness.coordinator.afterDelete(
      source: ActionSource.timeline,
      remoteAssetIds: [asset.id],
      movedToTrash: true,
    );

    expect(handler.reopenedRemoteAssetIds, isEmpty);
  });

  testWidgets('does nothing when no view intent is active', (tester) async {
    final asset = RemoteAssetFactory.create();
    final handler = _TestViewIntentHandler();
    final harness = await pumpHarness(
      tester,
      asset: asset,
      origin: TimelineOrigin.deepLink,
      handler: handler,
      activeViewIntent: false,
    );

    await harness.coordinator.afterDelete(source: ActionSource.viewer, remoteAssetIds: [asset.id], movedToTrash: true);

    expect(handler.reopenedRemoteAssetIds, isEmpty);
  });

  testWidgets('does nothing in a non-deep-link viewer', (tester) async {
    final asset = RemoteAssetFactory.create();
    final handler = _TestViewIntentHandler();
    final harness = await pumpHarness(tester, asset: asset, origin: TimelineOrigin.main, handler: handler);

    await harness.coordinator.afterDelete(source: ActionSource.viewer, remoteAssetIds: [asset.id], movedToTrash: true);

    expect(handler.reopenedRemoteAssetIds, isEmpty);
  });

  testWidgets('does not propagate a remote asset that cannot be reopened', (tester) async {
    final asset = RemoteAssetFactory.create();
    final handler = _TestViewIntentHandler(reopenResult: false);
    final harness = await pumpHarness(tester, asset: asset, origin: TimelineOrigin.deepLink, handler: handler);

    await harness.coordinator.afterDelete(source: ActionSource.viewer, remoteAssetIds: [asset.id], movedToTrash: true);

    expect(handler.reopenedRemoteAssetIds, [asset.id]);
  });

  testWidgets('does not propagate a reopen exception', (tester) async {
    final asset = RemoteAssetFactory.create(deletedAt: DateTime(2026, 8, 4));
    final handler = _TestViewIntentHandler(reopenError: StateError('reopen failed'));
    final harness = await pumpHarness(
      tester,
      asset: asset,
      origin: TimelineOrigin.deepLink,
      handler: handler,
      isTrashScoped: true,
    );

    await harness.coordinator.afterRestore(source: ActionSource.viewer, remoteAssetIds: [asset.id]);

    expect(handler.reopenedRemoteAssetIds, [asset.id]);
  });
}

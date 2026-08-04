import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_asset_action_coordinator.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../service.mocks.dart';
import '../../factories/local_asset_factory.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

class _MockViewIntentAssetActionCoordinator extends Mock implements ViewIntentAssetActionCoordinator {}

class _ViewerNotifier extends AssetViewerStateNotifier {
  _ViewerNotifier(this.asset);

  final BaseAsset asset;

  @override
  AssetViewerState build() {
    super.build();
    return AssetViewerState(currentAsset: asset);
  }
}

void main() {
  late PresentationContext context;
  late MockAssetService assetService;
  late MockCleanupService cleanupService;

  setUp(() async {
    context = await PresentationContext.create();
    assetService = context.service.asset.service;
    cleanupService = context.service.cleanup.service;
  });

  tearDown(() async {
    debugDefaultTargetPlatformOverride = null;
    await StoreService.I.put(StoreKey.manageLocalMediaAndroid, false);
    await context.dispose();
  });

  RemoteAsset owned({AssetVisibility visibility = .timeline, DateTime? deletedAt, String? localId}) =>
      RemoteAssetFactory.create(
        ownerId: context.currentUser.id,
        visibility: visibility,
        deletedAt: deletedAt,
        localId: localId,
      );

  TimelineService viewIntentTimeline(BaseAsset asset, TimelineOrigin origin) => TimelineService((
    assetSource: (_, __) async => [asset],
    bucketSource: () => Stream.value(const [Bucket(assetCount: 1)]),
    origin: origin,
  ));

  Future<void> pumpViewerDelete(WidgetTester tester, BaseAsset asset, TimelineService timeline, String filePath) async {
    await tester.pumpTestWidget(
      context,
      const ActionIconButton(action: DeleteAction(source: .viewer)),
      overrides: [
        timelineServiceProvider.overrideWithValue(timeline),
        assetViewerProvider.overrideWith(() => _ViewerNotifier(asset)),
      ],
    );

    final scope = ProviderScope.containerOf(tester.element(find.byType(ActionIconButton)), listen: false);
    scope.read(viewIntentFilePathProvider.notifier).setPath(filePath);
    await tester.pumpAndSettle();
  }

  Future<void> pumpDelete(WidgetTester tester, Set<BaseAsset> selection, {bool trashEnabled = true}) async {
    if (!trashEnabled) {
      when(
        () => context.service.serverInfo.getServerFeatures(),
      ).thenAnswer((_) async => const .new(trash: false, map: true, oauthEnabled: false, passwordLogin: true));
    }

    await tester.pumpTestWidget(
      context,
      const ActionIconButton(action: DeleteAction(source: .timeline)),
      overrides: context.selected(selection),
    );

    if (!trashEnabled) {
      final scope = ProviderScope.containerOf(tester.element(find.byType(ActionIconButton)), listen: false);
      await scope.read(serverInfoProvider.notifier).getServerFeatures();
      await tester.pumpAndSettle();
    }

    await tester.tap(find.byType(ImmichIconButton));
    await tester.pump();
  }

  Future<void> respondToDialog(WidgetTester tester, {required bool confirm}) async {
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.byType(ConfirmDialog), findsOneWidget);
    await tester.tap(find.byType(TextButton).at(confirm ? 1 : 0)); // [cancel, ok]
    await tester.pumpAndSettle();
  }

  group('DeleteAction', () {
    group('trash', () {
      testWidgets('trashes a remote-only owned asset', (tester) async {
        final asset = owned();

        await pumpDelete(tester, {asset});
        await tester.pumpAndSettle();

        verify(() => assetService.trash([asset.id])).called(1);
        verifyNever(() => assetService.delete(any()));
        verifyNever(() => cleanupService.deleteLocalAssets(any()));
      });

      testWidgets('ignores assets owned by someone else', (tester) async {
        final mine = owned();
        final theirs = RemoteAssetFactory.create();

        await pumpDelete(tester, {mine, theirs});
        await tester.pumpAndSettle();

        verify(() => assetService.trash([mine.id])).called(1);
      });

      testWidgets('trashes a merged asset and removes its device copy', (tester) async {
        final asset = owned(localId: 'local');

        await pumpDelete(tester, {asset});
        await tester.pumpAndSettle();

        verify(() => cleanupService.deleteLocalAssets(['local'])).called(1);
        verify(() => assetService.trash([asset.id])).called(1);
      });
    });

    group('permanent', () {
      testWidgets('permanently deletes when the trash feature is disabled', (tester) async {
        final asset = owned();

        await pumpDelete(tester, {asset}, trashEnabled: false);
        await respondToDialog(tester, confirm: true);

        verify(() => assetService.delete([asset.id])).called(1);
        verifyNever(() => assetService.trash(any()));
      });

      testWidgets('permanently deletes a merged asset and removes its device copy', (tester) async {
        final asset = owned(localId: 'local');

        await pumpDelete(tester, {asset}, trashEnabled: false);
        await respondToDialog(tester, confirm: true);

        verify(() => assetService.delete([asset.id])).called(1);
        verify(() => cleanupService.deleteLocalAssets(['local'])).called(1);
      });

      testWidgets('permanently deletes already trashed assets even with trash enabled', (tester) async {
        final asset = owned(deletedAt: DateTime(2024));

        await pumpDelete(tester, {asset});
        await respondToDialog(tester, confirm: true);

        verify(() => assetService.delete([asset.id])).called(1);
        verifyNever(() => assetService.trash(any()));
      });

      testWidgets('permanently deletes locked folder assets even with trash enabled', (tester) async {
        final asset = owned(visibility: .locked, localId: 'local');

        await pumpDelete(tester, {asset});
        await respondToDialog(tester, confirm: true);

        verify(() => assetService.delete([asset.id])).called(1);
        verify(() => cleanupService.deleteLocalAssets(['local'])).called(1);
      });

      testWidgets('does nothing when the confirmation is cancelled', (tester) async {
        final asset = owned(visibility: .locked, localId: 'local');

        await pumpDelete(tester, {asset});
        await respondToDialog(tester, confirm: false);

        verifyNever(() => assetService.delete(any()));
        verifyNever(() => cleanupService.deleteLocalAssets(any()));
      });
    });

    group('local only', () {
      testWidgets('removes the device copy with no remote call', (tester) async {
        final asset = LocalAssetFactory.create();

        await pumpDelete(tester, {asset});
        await tester.pumpAndSettle();

        verify(() => cleanupService.deleteLocalAssets([asset.id])).called(1);
        verifyNever(() => assetService.trash(any()));
        verifyNever(() => assetService.delete(any()));
      });
    });

    group('prompt handling', () {
      testWidgets('permanent delete shows a single app dialog', (tester) async {
        final asset = owned(localId: 'local');

        await pumpDelete(tester, {asset}, trashEnabled: false);
        await tester.pump(const Duration(milliseconds: 300));

        expect(find.text(StaticTranslations.instance.delete_dialog_title), findsOneWidget);
        await tester.tap(find.byType(TextButton).at(1));
        await tester.pumpAndSettle();

        expect(find.text(StaticTranslations.instance.move_to_device_trash), findsNothing);
        verify(() => assetService.delete([asset.id])).called(1);
        verify(() => cleanupService.deleteLocalAssets(['local'])).called(1);
      });

      testWidgets('local only delete on Android with MANAGE_MEDIA shows the prompt', (tester) async {
        debugDefaultTargetPlatformOverride = TargetPlatform.android;
        await StoreService.I.put(StoreKey.manageLocalMediaAndroid, true);
        final asset = LocalAssetFactory.create();

        await pumpDelete(tester, {asset});
        await tester.pump(const Duration(milliseconds: 300));

        expect(find.text(StaticTranslations.instance.move_to_device_trash), findsOneWidget);
        await tester.tap(find.byType(TextButton).at(1)); // confirm
        await tester.pumpAndSettle();

        verify(() => cleanupService.deleteLocalAssets([asset.id])).called(1);
        // Has to be cleared inside the body; the framework asserts on it before tearDown runs.
        debugDefaultTargetPlatformOverride = null;
      });

      testWidgets('local only delete on Android with MANAGE_MEDIA deletes nothing when cancelled', (tester) async {
        debugDefaultTargetPlatformOverride = TargetPlatform.android;
        await StoreService.I.put(StoreKey.manageLocalMediaAndroid, true);
        final asset = LocalAssetFactory.create();

        await pumpDelete(tester, {asset});
        await respondToDialog(tester, confirm: false);

        verifyNever(() => cleanupService.deleteLocalAssets(any()));
        debugDefaultTargetPlatformOverride = null;
      });
    });

    testWidgets('is hidden when nothing can be deleted', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: DeleteAction(source: .timeline)),
        overrides: context.selected({RemoteAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    group('view intent', () {
      testWidgets('delegates a successful delete to the view intent coordinator', (tester) async {
        final asset = owned();
        final timeline = viewIntentTimeline(asset, TimelineOrigin.deepLink);
        final coordinator = _MockViewIntentAssetActionCoordinator();
        addTearDown(timeline.dispose);
        when(() => coordinator.canDelete(ActionSource.viewer)).thenReturn(true);
        when(
          () => coordinator.afterDelete(source: ActionSource.viewer, remoteAssetIds: [asset.id], movedToTrash: true),
        ).thenAnswer((_) async {});

        await tester.pumpTestWidget(
          context,
          const ActionIconButton(action: DeleteAction(source: .viewer)),
          overrides: [
            timelineServiceProvider.overrideWithValue(timeline),
            assetViewerProvider.overrideWith(() => _ViewerNotifier(asset)),
            viewIntentAssetActionCoordinatorProvider.overrideWithValue(coordinator),
          ],
        );
        await tester.tap(find.byType(ImmichIconButton));
        await tester.pumpAndSettle();

        verify(
          () => coordinator.afterDelete(source: ActionSource.viewer, remoteAssetIds: [asset.id], movedToTrash: true),
        ).called(1);
      });

      testWidgets('clears timeline selection before the post-delete transition completes', (tester) async {
        final asset = owned();
        final coordinator = _MockViewIntentAssetActionCoordinator();
        final transition = Completer<void>();
        when(() => coordinator.canDelete(ActionSource.timeline)).thenReturn(true);
        when(
          () => coordinator.afterDelete(source: ActionSource.timeline, remoteAssetIds: [asset.id], movedToTrash: true),
        ).thenAnswer((_) => transition.future);

        await tester.pumpTestAction(
          context,
          const DeleteAction(source: .timeline),
          overrides: [
            ...context.selected({asset}),
            viewIntentAssetActionCoordinatorProvider.overrideWithValue(coordinator),
          ],
        );
        await tester.pump();

        expect(find.byType(ImmichIconButton), findsNothing, reason: 'successful deletion clears the selection');
        transition.complete();
        await tester.pumpAndSettle();
      });

      testWidgets('is hidden for a synthetic file-backed asset', (tester) async {
        final asset = LocalAssetFactory.create(id: '-42');
        final timeline = viewIntentTimeline(asset, TimelineOrigin.deepLink);
        addTearDown(timeline.dispose);

        await pumpViewerDelete(tester, asset, timeline, '/tmp/materialized.jpg');

        expect(find.byType(ImmichIconButton), findsNothing);
      });
    });

    testWidgets('clears selection when local cleanup finishes after the action context is disposed', (tester) async {
      final asset = LocalAssetFactory.create();
      final cleanupResult = Completer<int>();
      when(() => cleanupService.deleteLocalAssets([asset.id])).thenAnswer((_) => cleanupResult.future);

      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: DeleteAction(source: .timeline)),
        overrides: context.selected({asset}),
      );
      final navigator = tester.state<NavigatorState>(find.byType(Navigator));
      unawaited(
        navigator.push<void>(
          MaterialPageRoute(
            builder: (_) => const Scaffold(
              body: ActionIconButton(action: DeleteAction(source: .timeline)),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byType(ImmichIconButton));
      await tester.pump();
      navigator.pop();
      await tester.pumpAndSettle();
      cleanupResult.complete(1);
      await tester.pumpAndSettle();

      expect(find.byType(ImmichIconButton), findsNothing, reason: 'successful cleanup clears the selection');
    });
  });

  group('CleanupLocalAction', () {
    testWidgets('deletes only backed up device copies', (tester) async {
      final backedUp = LocalAssetFactory.create(remoteId: 'remote');
      final localOnly = LocalAssetFactory.create();

      await tester.pumpTestAction(
        context,
        const CleanupLocalAction(source: .timeline),
        overrides: context.selected({backedUp, localOnly}),
      );
      await tester.pumpAndSettle();

      verify(() => cleanupService.deleteLocalAssets([backedUp.id])).called(1);
    });

    testWidgets('is hidden when no backed up assets are selected', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: CleanupLocalAction(source: .timeline)),
        overrides: context.selected({LocalAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });
}

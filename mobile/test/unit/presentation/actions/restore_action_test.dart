import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/restore.action.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_asset_action_coordinator.provider.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../service.mocks.dart';
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

  setUp(() async {
    context = await PresentationContext.create();
    assetService = context.service.asset.service;
  });

  tearDown(() async {
    await context.dispose();
  });

  RemoteAsset owned({bool trashed = true}) =>
      RemoteAssetFactory.create(ownerId: context.currentUser.id, deletedAt: trashed ? .new(2020) : null);

  Future<void> pumpRestore(WidgetTester tester, Set<BaseAsset> selection) =>
      tester.pumpTestAction(context, const RestoreAction(source: .timeline), overrides: context.selected(selection));

  group('RestoreAction', () {
    testWidgets('restores the eligible owned trashed assets', (tester) async {
      final asset = owned();

      await pumpRestore(tester, {asset});

      verify(() => assetService.restoreTrash([asset.id])).called(1);
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create(deletedAt: .new(2020));

      await pumpRestore(tester, {mine, theirs});

      verify(() => assetService.restoreTrash([mine.id])).called(1);
    });

    testWidgets('skips owned assets that are not trashed', (tester) async {
      final trashed = owned();
      final live = owned(trashed: false);

      await pumpRestore(tester, {trashed, live});

      verify(() => assetService.restoreTrash([trashed.id])).called(1);
    });

    testWidgets('clears the selection once the restore succeeds', (tester) async {
      await pumpRestore(tester, {owned()});
      await tester.pumpAndSettle();

      expect(find.byType(ImmichIconButton), findsNothing, reason: 'an empty selection hides the action');
    });

    testWidgets('clears timeline selection before the post-restore transition completes', (tester) async {
      final asset = owned();
      final coordinator = _MockViewIntentAssetActionCoordinator();
      final transition = Completer<void>();
      when(
        () => coordinator.afterRestore(source: ActionSource.timeline, remoteAssetIds: [asset.id]),
      ).thenAnswer((_) => transition.future);

      await tester.pumpTestAction(
        context,
        const RestoreAction(source: .timeline),
        overrides: [
          ...context.selected({asset}),
          viewIntentAssetActionCoordinatorProvider.overrideWithValue(coordinator),
        ],
      );
      await tester.pump();

      expect(find.byType(ImmichIconButton), findsNothing, reason: 'successful restore clears the selection');
      transition.complete();
      await tester.pumpAndSettle();
    });

    testWidgets('delegates a successful viewer restore to the view intent coordinator', (tester) async {
      final asset = owned();
      final coordinator = _MockViewIntentAssetActionCoordinator();
      final timeline = TimelineService((
        assetSource: (_, __) async => [asset],
        bucketSource: () => Stream.value(const [Bucket(assetCount: 1)]),
        origin: TimelineOrigin.deepLink,
      ));
      addTearDown(timeline.dispose);
      when(
        () => coordinator.afterRestore(source: ActionSource.viewer, remoteAssetIds: [asset.id]),
      ).thenAnswer((_) async {});

      await tester.pumpTestAction(
        context,
        const RestoreAction(source: .viewer),
        overrides: [
          timelineServiceProvider.overrideWithValue(timeline),
          assetViewerProvider.overrideWith(() => _ViewerNotifier(asset)),
          viewIntentAssetActionCoordinatorProvider.overrideWithValue(coordinator),
        ],
      );
      await tester.pump();

      verify(() => assetService.restoreTrash([asset.id])).called(1);
      verify(() => coordinator.afterRestore(source: ActionSource.viewer, remoteAssetIds: [asset.id])).called(1);
    });

    testWidgets('is hidden when no owned asset is trashed', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: RestoreAction(source: .timeline)),
        overrides: context.selected({owned(trashed: false)}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });
}

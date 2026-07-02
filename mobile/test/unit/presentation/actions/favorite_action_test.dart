import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/actions/favorite.action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/trash_sync.provider.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../domain/service.mock.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockAssetService assetService;
  late TimelineService timeline;
  late List<Override> timelineOverrides;

  setUp(() async {
    context = await PresentationContext.create();
    assetService = context.service.asset.service;
    timeline = _timeline(TimelineOrigin.main);
    timelineOverrides = [timelineServiceProvider.overrideWithValue(timeline)];
  });

  tearDown(() {
    timeline.dispose();
    context.dispose();
  });

  RemoteAsset owned({bool isFavorite = false}) =>
      RemoteAssetFactory.create(ownerId: context.currentUser.id, isFavorite: isFavorite);

  group('FavoriteAction', () {
    testWidgets('favorites the eligible owned assets', (tester) async {
      final asset = owned();

      await tester.pumpTestAction(context, FavoriteAction(assets: [asset]), overrides: timelineOverrides);

      verify(() => assetService.updateFavorite([asset.id], true)).called(1);
    });

    testWidgets('unfavorite the eligible owned assets', (tester) async {
      final asset = owned(isFavorite: true);

      await tester.pumpTestAction(context, FavoriteAction(assets: [asset]), overrides: timelineOverrides);

      verify(() => assetService.updateFavorite([asset.id], false)).called(1);
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      await tester.pumpTestAction(context, FavoriteAction(assets: [mine, theirs]), overrides: timelineOverrides);

      verify(() => assetService.updateFavorite([mine.id], true)).called(1);
    });

    testWidgets('batches every eligible owned asset into a single call', (tester) async {
      final first = owned();
      final second = owned();

      await tester.pumpTestAction(context, FavoriteAction(assets: [first, second]), overrides: timelineOverrides);

      verify(() => assetService.updateFavorite([first.id, second.id], true)).called(1);
    });

    testWidgets('skips owned assets already in the target state', (tester) async {
      final stale = owned();
      final alreadyFavorite = owned(isFavorite: true);

      await tester.pumpTestAction(
        context,
        FavoriteAction(assets: [stale, alreadyFavorite]),
        overrides: timelineOverrides,
      );

      verify(() => assetService.updateFavorite([stale.id], true)).called(1);
    });

    testWidgets('ignores pending trash approval outside the sync trash timeline', (tester) async {
      final asset = owned();
      final timeline = _timeline(TimelineOrigin.main);
      addTearDown(timeline.dispose);

      await tester.pumpTestWidget(
        context,
        ActionIconButtonWidget(action: FavoriteAction(assets: [asset])),
        overrides: [
          timelineServiceProvider.overrideWithValue(timeline),
          isWaitingForTrashApprovalProvider.overrideWith((ref, checksum) => Stream.value(true)),
        ],
      );

      expect(find.byType(ImmichIconButton), findsOneWidget);
    });

    testWidgets('is hidden in the sync trash timeline', (tester) async {
      final syncTrashTimeline = _timeline(TimelineOrigin.syncTrash);
      addTearDown(syncTrashTimeline.dispose);

      await tester.pumpTestWidget(
        context,
        ActionIconButtonWidget(action: FavoriteAction(assets: [owned()])),
        overrides: [timelineServiceProvider.overrideWithValue(syncTrashTimeline)],
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('shows a confirmation snackbar on success', (tester) async {
      await tester.pumpTestAction(context, FavoriteAction(assets: [owned()]), overrides: timelineOverrides);
      await tester.pumpUntilFound(find.byType(SnackBar));

      expect(find.byType(SnackBar), findsOneWidget);
    });
  });
}

TimelineService _timeline(TimelineOrigin origin) => TimelineService((
  assetSource: (index, count) async => const [],
  bucketSource: () => Stream.value(const <Bucket>[]),
  origin: origin,
));

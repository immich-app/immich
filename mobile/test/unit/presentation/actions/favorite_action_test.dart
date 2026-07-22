import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/favorite.action.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../../domain/service.mock.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockAssetService assetService;

  setUp(() async {
    context = await PresentationContext.create();
    assetService = context.service.asset.service;
  });

  tearDown(() {
    context.dispose();
  });

  RemoteAsset owned({bool isFavorite = false}) =>
      RemoteAssetFactory.create(ownerId: context.currentUser.id, isFavorite: isFavorite);

  List<Override> selection(Set<BaseAsset> assets) => [
    multiSelectProvider.overrideWith(
      () => MultiSelectNotifier(MultiSelectState(selectedAssets: assets, lockedSelectionAssets: const {})),
    ),
  ];

  group('FavoriteAction', () {
    testWidgets('favorites the eligible owned assets', (tester) async {
      final asset = owned();

      await tester.pumpTestAction(
        context,
        const FavoriteAction(display: ActionDisplay.iconButton),
        overrides: selection({asset}),
      );

      verify(() => assetService.updateFavorite([asset.id], true)).called(1);
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      await tester.pumpTestAction(
        context,
        const FavoriteAction(display: ActionDisplay.iconButton),
        overrides: selection({mine, theirs}),
      );

      verify(() => assetService.updateFavorite([mine.id], true)).called(1);
    });

    testWidgets('batches every eligible owned asset into a single call', (tester) async {
      final first = owned();
      final second = owned();

      await tester.pumpTestAction(
        context,
        const FavoriteAction(display: ActionDisplay.iconButton),
        overrides: selection({first, second}),
      );

      verify(() => assetService.updateFavorite([first.id, second.id], true)).called(1);
    });

    testWidgets('skips owned assets already favorited', (tester) async {
      final stale = owned();
      final alreadyFavorite = owned(isFavorite: true);

      await tester.pumpTestAction(
        context,
        const FavoriteAction(display: ActionDisplay.iconButton),
        overrides: selection({stale, alreadyFavorite}),
      );

      verify(() => assetService.updateFavorite([stale.id], true)).called(1);
    });

    testWidgets('shows a confirmation snackbar on success', (tester) async {
      await tester.pumpTestAction(
        context,
        const FavoriteAction(display: ActionDisplay.iconButton),
        overrides: selection({owned()}),
      );
      await tester.pumpUntilFound(find.byType(SnackBar));

      expect(find.byType(SnackBar), findsOneWidget);
    });
  });

  group('UnfavoriteAction', () {
    testWidgets('unfavorites the eligible owned assets', (tester) async {
      final asset = owned(isFavorite: true);

      await tester.pumpTestAction(
        context,
        const UnfavoriteAction(display: ActionDisplay.iconButton),
        overrides: selection({asset}),
      );

      verify(() => assetService.updateFavorite([asset.id], false)).called(1);
    });
  });
}

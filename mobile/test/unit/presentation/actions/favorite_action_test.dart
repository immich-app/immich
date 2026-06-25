import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/favorite.action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../factories/remote_asset_factory.dart';
import '../../presentation_context.dart';

void main() {
  late PresentationContext context;

  setUp(() async {
    context = await PresentationContext.create();
  });

  tearDown(() {
    context.dispose();
  });

  List<Override> overrides() => [
    ...context.overrides,
    assetServiceProvider.overrideWithValue(context.mocks.asset.service),
  ];

  RemoteAsset owned({bool isFavorite = false}) =>
      RemoteAssetFactory.create(ownerId: context.currentUser.id, isFavorite: isFavorite);

  group('FavoriteAction', () {
    testWidgets('favorites the eligible owned assets', (tester) async {
      final asset = owned();

      await tester.pumpTestAction(FavoriteAction(assets: [asset], favorite: true), overrides: overrides());

      verify(() => context.mocks.asset.service.updateFavorite([asset.id], true)).called(1);
    });

    testWidgets('unfavorite the eligible owned assets', (tester) async {
      final asset = owned(isFavorite: true);

      await tester.pumpTestAction(FavoriteAction(assets: [asset], favorite: false), overrides: overrides());

      verify(() => context.mocks.asset.service.updateFavorite([asset.id], false)).called(1);
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      await tester.pumpTestAction(FavoriteAction(assets: [mine, theirs], favorite: true), overrides: overrides());

      verify(() => context.mocks.asset.service.updateFavorite([mine.id], true)).called(1);
    });

    testWidgets('batches every eligible owned asset into a single call', (tester) async {
      final first = owned();
      final second = owned();

      await tester.pumpTestAction(FavoriteAction(assets: [first, second], favorite: true), overrides: overrides());

      verify(() => context.mocks.asset.service.updateFavorite([first.id, second.id], true)).called(1);
    });

    testWidgets('skips owned assets already in the target state', (tester) async {
      final stale = owned();
      final alreadyFavorite = owned(isFavorite: true);

      await tester.pumpTestAction(
        FavoriteAction(assets: [stale, alreadyFavorite], favorite: true),
        overrides: overrides(),
      );

      verify(() => context.mocks.asset.service.updateFavorite([stale.id], true)).called(1);
    });

    testWidgets('shows a confirmation snackbar on success', (tester) async {
      await tester.pumpTestAction(FavoriteAction(assets: [owned()], favorite: true), overrides: overrides());
      await tester.pumpUntilFound(find.byType(SnackBar));

      expect(find.byType(SnackBar), findsOneWidget);
    });

    testWidgets('is hidden when no asset is eligible', (tester) async {
      final asset = owned(isFavorite: true);

      await tester.pumpTestWidget(
        ActionIconButtonWidget(action: FavoriteAction(assets: [asset], favorite: true)),
        overrides: overrides(),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });
}

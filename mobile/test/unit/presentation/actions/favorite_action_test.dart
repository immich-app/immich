import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/favorite.action.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../service.mocks.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

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

  RemoteAsset owned({bool isFavorite = false}) =>
      RemoteAssetFactory.create(ownerId: context.currentUser.id, isFavorite: isFavorite);

  Future<void> pumpFavorite(WidgetTester tester, Set<BaseAsset> selection) =>
      tester.pumpTestAction(context, const FavoriteAction(source: .timeline), overrides: context.selected(selection));

  group('FavoriteAction', () {
    testWidgets('favorites the eligible owned assets', (tester) async {
      final asset = owned();

      await pumpFavorite(tester, {asset});

      verify(() => assetService.update([asset.id], isFavorite: const Option.some(true))).called(1);
    });

    testWidgets('unfavorite the eligible owned assets', (tester) async {
      final asset = owned(isFavorite: true);

      await pumpFavorite(tester, {asset});

      verify(() => assetService.update([asset.id], isFavorite: const Option.some(false))).called(1);
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      await pumpFavorite(tester, {mine, theirs});

      verify(() => assetService.update([mine.id], isFavorite: const Option.some(true))).called(1);
    });

    testWidgets('skips owned assets already in the target state', (tester) async {
      final stale = owned();
      final alreadyFavorite = owned(isFavorite: true);

      await pumpFavorite(tester, {stale, alreadyFavorite});

      verify(() => assetService.update([stale.id], isFavorite: const Option.some(true))).called(1);
    });

    testWidgets('shows a confirmation snackbar on success', (tester) async {
      await pumpFavorite(tester, {owned()});
      await tester.pumpUntilFound(find.byType(SnackBar));

      expect(find.byType(SnackBar), findsOneWidget);
    });

    testWidgets('clears the selection once the update succeeds', (tester) async {
      await pumpFavorite(tester, {owned()});
      await tester.pumpAndSettle();

      expect(find.byType(ImmichIconButton), findsNothing, reason: 'an empty selection hides the action');
    });

    testWidgets('is hidden when none of the selected assets are owned', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: FavoriteAction(source: .timeline)),
        overrides: context.selected({RemoteAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/favorite.action.dart';
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

  group('FavoriteAction', () {
    testWidgets('favorites the eligible owned assets', (tester) async {
      final asset = owned();

      await tester.pumpTestAction(context, FavoriteAction(assets: [asset]));

      verify(() => assetService.updateFavorite([asset.id], true)).called(1);
    });

    testWidgets('unfavorite the eligible owned assets', (tester) async {
      final asset = owned(isFavorite: true);

      await tester.pumpTestAction(context, FavoriteAction(assets: [asset]));

      verify(() => assetService.updateFavorite([asset.id], false)).called(1);
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      await tester.pumpTestAction(context, FavoriteAction(assets: [mine, theirs]));

      verify(() => assetService.updateFavorite([mine.id], true)).called(1);
    });

    testWidgets('batches every eligible owned asset into a single call', (tester) async {
      final first = owned();
      final second = owned();

      await tester.pumpTestAction(context, FavoriteAction(assets: [first, second]));

      verify(() => assetService.updateFavorite([first.id, second.id], true)).called(1);
    });

    testWidgets('skips owned assets already in the target state', (tester) async {
      final stale = owned();
      final alreadyFavorite = owned(isFavorite: true);

      await tester.pumpTestAction(context, FavoriteAction(assets: [stale, alreadyFavorite]));

      verify(() => assetService.updateFavorite([stale.id], true)).called(1);
    });

    testWidgets('reports the favorite count through the toast repository', (tester) async {
      final toast = context.repository.toast;

      await tester.pumpTestAction(context, FavoriteAction(assets: [owned(), owned()]));

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.favorite_action_prompt(count: 2));
    });

    testWidgets('reports the unfavorite count through the toast repository', (tester) async {
      final toast = context.repository.toast;

      await tester.pumpTestAction(context, FavoriteAction(assets: [owned(isFavorite: true), owned(isFavorite: true)]));

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.unfavorite_action_prompt(count: 2));
    });
  });
}

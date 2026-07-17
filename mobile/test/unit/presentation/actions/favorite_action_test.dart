import 'package:flutter/material.dart';
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
    const action = FavoriteAction();

    testWidgets('favorites the eligible owned assets', (tester) async {
      final asset = owned();
      final resolved = await tester.runAction(context, action, assets: [asset]);

      expect(resolved!.icon, Icons.favorite_border_rounded);
      expect(resolved.label, StaticTranslations.instance.favorite);
      verify(() => assetService.update([asset.id], isFavorite: const .some(true))).called(1);
    });

    testWidgets('batches every eligible owned asset into a single call', (tester) async {
      final first = owned();
      final second = owned();

      await tester.runAction(context, action, assets: [first, second]);

      verify(() => assetService.update([first.id, second.id], isFavorite: const .some(true))).called(1);
    });

    testWidgets('favorites only the owned assets not already favorite', (tester) async {
      final stale = owned();
      final alreadyFavorite = owned(isFavorite: true);

      await tester.runAction(context, action, assets: [stale, alreadyFavorite]);

      verify(() => assetService.update([stale.id], isFavorite: const .some(true))).called(1);
    });

    testWidgets('ignores assets owned by others', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      await tester.runAction(context, action, assets: [mine, theirs]);

      verify(() => assetService.update([mine.id], isFavorite: const .some(true))).called(1);
    });

    testWidgets('reports the favorite count through the toast repository', (tester) async {
      final toast = context.repository.toast;

      await tester.runAction(context, action, assets: [owned(), owned()]);

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.favorite_action_prompt(count: 2));
    });
  });

  group('UnfavoriteAction', () {
    const action = UnfavoriteAction();

    testWidgets('unfavorite the owned assets when every one is favorite', (tester) async {
      final asset = owned(isFavorite: true);
      final resolved = await tester.runAction(context, action, assets: [asset]);

      expect(resolved!.icon, Icons.favorite_rounded);
      expect(resolved.label, StaticTranslations.instance.unfavorite);
      verify(() => assetService.update([asset.id], isFavorite: const .some(false))).called(1);
    });

    testWidgets('ignores assets owned by others', (tester) async {
      final mine = owned(isFavorite: true);
      final theirs = RemoteAssetFactory.create(isFavorite: true);

      await tester.runAction(context, action, assets: [mine, theirs]);

      verify(() => assetService.update([mine.id], isFavorite: const .some(false))).called(1);
    });

    testWidgets('reports the unfavorite count through the toast repository', (tester) async {
      final toast = context.repository.toast;

      await tester.runAction(context, action, assets: [owned(isFavorite: true), owned(isFavorite: true)]);

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.unfavorite_action_prompt(count: 2));
    });
  });

  group('toggle visibility', () {
    testWidgets('a mixed selection shows Favorite but not Unfavorite', (tester) async {
      final assets = [owned(), owned(isFavorite: true)];

      final favorite = await tester.resolveAction(context, const FavoriteAction(), assets: assets);
      final unfavorite = await tester.resolveAction(context, const UnfavoriteAction(), assets: assets);

      expect(favorite, isNotNull);
      expect(unfavorite, isNull);
    });

    testWidgets('an all-favorite selection shows Unfavorite but not Favorite', (tester) async {
      final assets = [owned(isFavorite: true), owned(isFavorite: true)];

      final favorite = await tester.resolveAction(context, const FavoriteAction(), assets: assets);
      final unfavorite = await tester.resolveAction(context, const UnfavoriteAction(), assets: assets);

      expect(favorite, isNull);
      expect(unfavorite, isNotNull);
    });
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/remove_from_album.action.dart';
import 'package:mocktail/mocktail.dart';

import '../../../domain/service.mock.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockRemoteAlbumService albumService;

  setUp(() async {
    context = await PresentationContext.create();
    albumService = context.service.album.service;
  });

  tearDown(() {
    context.dispose();
  });

  RemoteAsset remote() => RemoteAssetFactory.create(ownerId: context.currentUser.id);

  group('RemoveFromAlbumAction', () {
    testWidgets('removes the selected remote assets from the album', (tester) async {
      final first = remote();
      final second = remote();
      final albumId = 'album';
      final action = await tester.pumpTestAction(
        context,
        (scope) => RemoveFromAlbumAction(assets: [first, second], albumId: albumId, scope: scope),
      );

      expect(action.icon, Icons.remove_circle_outline);
      expect(action.label, StaticTranslations.instance.remove_from_album);
      verify(() => albumService.removeAssets(albumId: albumId, assetIds: [first.id, second.id])).called(1);
    });

    testWidgets('reports the removed count through the toast repository', (tester) async {
      final toast = context.repository.toast;
      final albumId = 'album';
      when(context.service.album.removeAssets).thenAnswer((_) async => 2);

      await tester.pumpTestAction(
        context,
        (scope) => RemoveFromAlbumAction(assets: [remote(), remote()], albumId: albumId, scope: scope),
      );

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.remove_from_album_action_prompt(count: 2));
    });
  });
}

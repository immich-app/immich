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

  const action = RemoveFromAlbumAction(albumId: 'album');

  group('RemoveFromAlbumAction', () {
    testWidgets('removes the selected remote assets from the album', (tester) async {
      final first = remote();
      final second = remote();
      final resolved = await tester.runAction(context, action, assets: [first, second]);

      expect(resolved!.icon, Icons.remove_circle_outline);
      expect(resolved.label, StaticTranslations.instance.remove_from_album);
      verify(() => albumService.removeAssets(albumId: 'album', assetIds: [first.id, second.id])).called(1);
    });

    testWidgets('reports the removed count through the toast repository', (tester) async {
      final toast = context.repository.toast;
      when(context.service.album.removeAssets).thenAnswer((_) async => 2);

      await tester.runAction(context, action, assets: [remote(), remote()]);

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.remove_from_album_action_prompt(count: 2));
    });
  });
}

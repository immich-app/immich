import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/set_album_cover.action.dart';
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

  const action = SetAlbumCoverAction(albumId: 'album');

  group('SetAlbumCoverAction', () {
    testWidgets('sets the selected asset as the album cover', (tester) async {
      final asset = remote();
      final resolved = await tester.runAction(context, action, assets: [asset]);

      expect(resolved!.icon, Icons.image_outlined);
      expect(resolved.label, StaticTranslations.instance.set_as_album_cover);
      verify(() => albumService.updateAlbum('album', thumbnailAssetId: asset.id)).called(1);
    });

    testWidgets('is hidden unless exactly one remote asset is selected', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [remote(), remote()]);

      expect(resolved, isNull);
    });
  });
}

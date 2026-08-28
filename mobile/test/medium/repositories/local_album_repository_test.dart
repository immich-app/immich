import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late LocalAlbumRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = LocalAlbumRepository(ctx.db);
  });

  tearDown(() async {
    debugDefaultTargetPlatformOverride = null;
    await ctx.dispose();
  });

  group('upsert', () {
    final album = LocalAlbum(id: 'album', name: 'Camera', updatedAt: DateTime(2024));

    Future<({String? checksum, String? priorChecksum})> row(String id) async {
      final data = await ctx.db.managers.localAssetEntity.filter((row) => row.id.equals(id)).getSingle();
      return (checksum: data.checksum, priorChecksum: data.priorChecksum);
    }

    for (final (platform, edited) in [
      (TargetPlatform.android, _localAsset('edited', updatedAt: DateTime(2025))),
      (TargetPlatform.iOS, _localAsset('edited', adjustmentTime: DateTime(2025))),
    ]) {
      test('${platform.name} remembers the checksum it clears', () async {
        debugDefaultTargetPlatformOverride = platform;
        await ctx.newLocalAsset(id: 'edited', checksum: 'a', updatedAt: DateTime(2024), adjustmentTime: DateTime(2024));
        await ctx.newLocalAsset(
          id: 'untouched',
          checksum: 'b',
          updatedAt: DateTime(2024),
          adjustmentTime: DateTime(2024),
        );

        await sut.upsert(album, toUpsert: [edited, _localAsset('untouched')]);

        expect(await row('edited'), (checksum: null, priorChecksum: 'a'));
        expect(await row('untouched'), (checksum: 'b', priorChecksum: null));
      });
    }
  });
}

LocalAsset _localAsset(String id, {DateTime? updatedAt, DateTime? adjustmentTime}) => LocalAsset(
  id: id,
  name: '$id.jpg',
  type: AssetType.image,
  createdAt: DateTime(2024),
  updatedAt: updatedAt ?? DateTime(2024),
  adjustmentTime: adjustmentTime ?? DateTime(2024),
  playbackStyle: AssetPlaybackStyle.image,
  isEdited: false,
);

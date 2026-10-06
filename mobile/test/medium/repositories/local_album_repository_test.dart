import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';

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

    Future<({String? checksum, String? previousChecksum})> row(String id) async {
      final data = await ctx.db.managers.localAssetEntity.filter((row) => row.id.equals(id)).getSingle();
      return (checksum: data.checksum, previousChecksum: data.previousChecksum);
    }

    for (final (platform, scenario, before, edited, after) in [
      (
        TargetPlatform.android,
        'updatedAt changed clears the checksum and remembers it',
        (checksum: 'a', previousChecksum: null),
        _localAsset('edited', updatedAt: DateTime(2025)),
        (checksum: null, previousChecksum: 'a'),
      ),
      (
        TargetPlatform.android,
        'adjustmentTime changed keeps the checksum',
        (checksum: 'a', previousChecksum: null),
        _localAsset('edited', adjustmentTime: DateTime(2025)),
        (checksum: 'a', previousChecksum: null),
      ),
      (
        TargetPlatform.android,
        'updatedAt changed again before the upload keeps the uploaded checksum',
        (checksum: 'b', previousChecksum: 'a'),
        _localAsset('edited', updatedAt: DateTime(2025)),
        (checksum: null, previousChecksum: 'a'),
      ),
      (
        TargetPlatform.iOS,
        'adjustmentTime changed clears the checksum and remembers it',
        (checksum: 'a', previousChecksum: null),
        _localAsset('edited', adjustmentTime: DateTime(2025)),
        (checksum: null, previousChecksum: 'a'),
      ),
      (
        TargetPlatform.iOS,
        'updatedAt changed keeps the checksum',
        (checksum: 'a', previousChecksum: null),
        _localAsset('edited', updatedAt: DateTime(2025)),
        (checksum: 'a', previousChecksum: null),
      ),
      (
        TargetPlatform.iOS,
        'adjustmentTime changed again before the upload keeps the uploaded checksum',
        (checksum: 'b', previousChecksum: 'a'),
        _localAsset('edited', adjustmentTime: DateTime(2025)),
        (checksum: null, previousChecksum: 'a'),
      ),
    ]) {
      test('${platform.name}: $scenario', () async {
        debugDefaultTargetPlatformOverride = platform;
        await ctx.newLocalAsset(
          id: 'edited',
          checksum: before.checksum,
          previousChecksum: before.previousChecksum,
          updatedAt: DateTime(2024),
          adjustmentTime: DateTime(2024),
        );

        await sut.upsert(album, toUpsert: [edited]);

        expect(await row('edited'), after);
      });
    }

    test('android: previous follows the uploads across two edits', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.android;
      final assets = LocalAssetRepository(ctx.db);
      await ctx.newLocalAsset(id: 'edited', checksum: 'a', updatedAt: DateTime(2024), adjustmentTime: DateTime(2024));

      await assets.updatePreviousChecksum('edited', 'a');
      await sut.upsert(album, toUpsert: [_localAsset('edited', updatedAt: DateTime(2025))]);
      expect(await row('edited'), (checksum: null, previousChecksum: 'a'));

      await assets.updateHashes({'edited': 'b'});
      await assets.updatePreviousChecksum('edited', 'b');
      await sut.upsert(album, toUpsert: [_localAsset('edited', updatedAt: DateTime(2026))]);
      expect(await row('edited'), (checksum: null, previousChecksum: 'b'));
    });
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

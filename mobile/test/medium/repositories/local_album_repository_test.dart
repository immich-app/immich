import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/data/db/main/table/local/album.dart';
import 'package:immich_mobile/data/db/main/table/local/asset.dart';
import 'package:immich_mobile/data/db/main/table/local/asset.drift.dart';
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
          width: edited.width,
          height: edited.height,
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

  group('with a synced asset', () {
    late LocalAlbum album;
    late LocalAsset asset;
    const checksum = 'checksum';

    Future<LocalAssetEntityData> assetInDb(String id) =>
        (ctx.db.select(ctx.db.localAssetEntity)..where((r) => r.id.equals(id))).getSingle();

    setUp(() async {
      album = (await ctx.newLocalAlbum()).toDto(assetCount: 1);
      asset = (await ctx.newLocalAsset(
        checksum: checksum,
        size: 1234,
        width: 12,
        height: 34,
        adjustmentTime: DateTime.utc(2026, 1, 2, 3),
      )).toDto();
      await sut.upsert(album, toUpsert: [asset]);
    });

    group('upsert on Android', () {
      setUp(() => debugDefaultTargetPlatformOverride = .android);

      group('resets the checksum', () {
        test('when the size changed', () async {
          await sut.upsert(album, toUpsert: [asset.copyWith(size: 4567)]);
          expect((await assetInDb(asset.id)).checksum, isNull);
        });

        test('when the dimensions were swapped', () async {
          await sut.upsert(album, toUpsert: [asset.copyWith(width: 34, height: 12)]);
          expect((await assetInDb(asset.id)).checksum, isNull);
        });

        test('when the modified time changed', () async {
          final later = asset.updatedAt.add(const .new(minutes: 1));
          await sut.upsert(album, toUpsert: [asset.copyWith(updatedAt: later)]);
          expect((await assetInDb(asset.id)).checksum, isNull);
        });
      });

      group('keeps the checksum', () {
        test('when nothing changed', () async {
          await sut.upsert(album, toUpsert: [asset]);
          expect((await assetInDb(asset.id)).checksum, checksum);
        });

        test('when only the name changed', () async {
          await sut.upsert(album, toUpsert: [asset.copyWith(name: 'new-name')]);
          expect((await assetInDb(asset.id)).checksum, checksum);
        });

        test('when only the favourite flag changed', () async {
          await sut.upsert(album, toUpsert: [asset.copyWith(isFavorite: true)]);
          expect((await assetInDb(asset.id)).checksum, checksum);
        });

        test('when only the created time changed', () async {
          await sut.upsert(album, toUpsert: [asset.copyWith(createdAt: asset.createdAt.add(const .new(days: 1)))]);
          expect((await assetInDb(asset.id)).checksum, checksum);
        });
      });

      test('refreshes the other fields while keeping the checksum', () async {
        final updated = asset.copyWith(name: 'new-name', isFavorite: true);
        await sut.upsert(album, toUpsert: [updated]);

        final row = await assetInDb(asset.id);
        expect(row.name, updated.name);
        expect(row.isFavorite, isTrue);
        expect(row.checksum, checksum);
      });
    });

    group('upsert on iOS', () {
      setUp(() => debugDefaultTargetPlatformOverride = .iOS);

      test('resets the checksum when the adjustment time changed', () async {
        await sut.upsert(album, toUpsert: [asset.copyWith(adjustmentTime: DateTime.utc(2026, 2, 3))]);
        expect((await assetInDb(asset.id)).checksum, isNull);
      });

      group('keeps the checksum', () {
        test('when nothing changed', () async {
          await sut.upsert(album, toUpsert: [asset]);
          expect((await assetInDb(asset.id)).checksum, checksum);
        });

        test('when the modified time changed', () async {
          await sut.upsert(album, toUpsert: [asset.copyWith(updatedAt: asset.updatedAt.add(const .new(days: 1)))]);
          expect((await assetInDb(asset.id)).checksum, checksum);
        });

        test('when the name or favorite changed', () async {
          await sut.upsert(album, toUpsert: [asset.copyWith(name: 'new-name', isFavorite: true)]);
          expect((await assetInDb(asset.id)).checksum, checksum);
        });

        test('when the coordinates changed', () async {
          await sut.upsert(album, toUpsert: [asset.copyWith(latitude: 1, longitude: 2)]);
          expect((await assetInDb(asset.id)).checksum, checksum);
        });
      });

      test('refreshes the other fields while keeping the checksum', () async {
        final updated = asset.copyWith(name: 'new-name', isFavorite: true);
        await sut.upsert(album, toUpsert: [updated]);

        final row = await assetInDb(asset.id);
        expect(row.name, updated.name);
        expect(row.latitude, updated.latitude);
        expect(row.longitude, updated.longitude);
        expect(row.checksum, checksum);
      });
    });

    group('resetSync', () {
      test('marks every album as never synced so the next sync cannot skip it', () async {
        final other = await ctx.newLocalAlbum();
        await sut.resetSync();

        final rows = await ctx.db.select(ctx.db.localAlbumEntity).get();
        expect(rows, hasLength(2));
        expect(rows.map((a) => a.updatedAt), everyElement(kLocalAlbumNeverSynced));
        expect(rows.map((a) => a.id), containsAll([album.id, other.id]));
      });
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
  width: 100,
  height: 100,
  playbackStyle: AssetPlaybackStyle.image,
  isEdited: false,
);

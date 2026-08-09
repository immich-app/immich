import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftLocalAlbumRepository sut;
  late LocalAlbum album;
  late LocalAsset asset;
  const checksum = 'checksum';

  Future<LocalAssetEntityData> assetInDb(String id) =>
      (ctx.db.select(ctx.db.localAssetEntity)..where((r) => r.id.equals(id))).getSingle();

  setUp(() async {
    ctx = MediumRepositoryContext();
    sut = DriftLocalAlbumRepository(ctx.db);

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

  tearDown(() async {
    debugDefaultTargetPlatformOverride = null;
    await ctx.dispose();
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

      test('when only the favorite flag changed', () async {
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
}

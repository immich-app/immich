import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late RemoteAlbumRepository sut;

  setUp(() async {
    ctx = MediumRepositoryContext();
    sut = RemoteAlbumRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('addAssets', () {
    test('sets the first added asset as thumbnail when the album has no thumbnail', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final asset = await ctx.newRemoteAsset(ownerId: user.id);

      await sut.addAssets(album.id, [asset.id]);

      final updated = await sut.get(album.id);
      expect(updated?.thumbnailAssetId, asset.id);
      expect(updated?.assetCount, 1);
    });

    test('preserves an existing thumbnail when adding assets', () async {
      final user = await ctx.newUser();
      final thumbnail = await ctx.newRemoteAsset(ownerId: user.id);
      final album = await ctx.newRemoteAlbum(ownerId: user.id, thumbnailAssetId: thumbnail.id);
      final asset = await ctx.newRemoteAsset(ownerId: user.id);

      await sut.addAssets(album.id, [asset.id]);

      final updated = await sut.get(album.id);
      expect(updated?.thumbnailAssetId, thumbnail.id);
      expect(updated?.assetCount, 1);
    });
  });

  group('getAll', () {
    test('returns album when all of its assets are trashed', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final asset1 = await ctx.newRemoteAsset(ownerId: user.id, deletedAt: DateTime(2025, 1, 1));
      final asset2 = await ctx.newRemoteAsset(ownerId: user.id, deletedAt: DateTime(2025, 1, 1));
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset1.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset2.id);

      final albums = await sut.getAll();

      expect(albums, hasLength(1));
      expect(albums.first.id, album.id);
      expect(albums.first.assetCount, 0);
    });

    test('excludes trashed assets from assetCount', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final active1 = await ctx.newRemoteAsset(ownerId: user.id);
      final active2 = await ctx.newRemoteAsset(ownerId: user.id);
      final trashed = await ctx.newRemoteAsset(ownerId: user.id, deletedAt: DateTime(2025, 1, 1));
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: active1.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: active2.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: trashed.id);

      final albums = await sut.getAll();

      expect(albums, hasLength(1));
      expect(albums.first.assetCount, 2);
    });

    test('returns album without assets', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);

      final albums = await sut.getAll();

      expect(albums, hasLength(1));
      expect(albums.first.id, album.id);
      expect(albums.first.assetCount, 0);
    });

    test('excludes non-default visibility assets (hidden/locked) from assetCount', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final active = await ctx.newRemoteAsset(ownerId: user.id, visibility: AssetVisibility.timeline);
      final archived = await ctx.newRemoteAsset(ownerId: user.id, visibility: AssetVisibility.archive);
      final hidden = await ctx.newRemoteAsset(ownerId: user.id, visibility: AssetVisibility.hidden);
      final locked = await ctx.newRemoteAsset(ownerId: user.id, visibility: AssetVisibility.locked);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: active.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: archived.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: hidden.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: locked.id);

      final albums = await sut.getAll();

      expect(albums, hasLength(1));
      expect(albums.first.assetCount, 2);
    });
  });

  group('get', () {
    test('returns the album when all of its assets are trashed', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final asset = await ctx.newRemoteAsset(ownerId: user.id, deletedAt: DateTime(2025, 1, 1));
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset.id);

      final result = await sut.get(album.id);

      expect(result, isNotNull);
      expect(result?.id, album.id);
      expect(result?.assetCount, 0);
    });

    test('excludes non-default visibility assets (hidden/locked) from assetCount', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final active = await ctx.newRemoteAsset(ownerId: user.id, visibility: AssetVisibility.timeline);
      final hidden = await ctx.newRemoteAsset(ownerId: user.id, visibility: AssetVisibility.hidden);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: active.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: hidden.id);

      final result = await sut.get(album.id);

      expect(result, isNotNull);
      expect(result?.assetCount, 1);
    });
  });

  group('getAlbumsContainingAsset', () {
    test('excludes trashed assets from assetCount', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      final trashed = await ctx.newRemoteAsset(ownerId: user.id, deletedAt: DateTime(2025, 1, 1));
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: trashed.id);

      final albums = await sut.getAlbumsContainingAsset(asset.id);

      expect(albums, hasLength(1));
      expect(albums.first.id, album.id);
      expect(albums.first.assetCount, 1);
    });

    test('returns albums for a trashed asset', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final trashed = await ctx.newRemoteAsset(ownerId: user.id, deletedAt: DateTime(2025, 1, 1));
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: trashed.id);

      final albums = await sut.getAlbumsContainingAsset(trashed.id);

      expect(albums, hasLength(1));
      expect(albums.first.assetCount, 0);
    });

    test('excludes non-default visibility assets from assetCount', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);
      final active = await ctx.newRemoteAsset(ownerId: user.id);
      final hidden = await ctx.newRemoteAsset(ownerId: user.id, visibility: AssetVisibility.hidden);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: active.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: hidden.id);

      final albums = await sut.getAlbumsContainingAsset(active.id);

      expect(albums, hasLength(1));
      expect(albums.first.assetCount, 1);
    });
  });

  group('watchDateRange', () {
    test('excludes trashed and hidden/locked assets from date range calculation', () async {
      final user = await ctx.newUser();
      final album = await ctx.newRemoteAlbum(ownerId: user.id);

      final trashed = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime(2023, 1, 1),
        deletedAt: DateTime(2025, 1, 1),
      );
      final active1 = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime(2024, 5, 10),
        visibility: AssetVisibility.timeline,
      );
      final active2 = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime(2024, 10, 10),
        visibility: AssetVisibility.archive,
      );
      final hidden = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime(2024, 12, 1),
        visibility: AssetVisibility.hidden,
      );

      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: trashed.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: active1.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: active2.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: hidden.id);

      final range = await sut.watchDateRange(album.id).first;

      // Trashed (Jan 2023) and hidden (Dec 2024) are excluded; range is May–Oct 2024
      expect(range.$1.toUtc(), active1.createdAt.toUtc());
      expect(range.$2.toUtc(), active2.createdAt.toUtc());
    });
  });

  group('getSortedAlbumIds', () {
    late String userId;

    setUp(() async {
      final user = await ctx.newUser();
      userId = user.id;
    });

    test('returns empty list when albumIds is empty', () async {
      final result = await sut.getSortedAlbumIds([], aggregation: AssetDateAggregation.start);
      expect(result, isEmpty);
    });

    test('returns single album when only one album exists', () async {
      final album = await ctx.newRemoteAlbum(ownerId: userId);
      final asset = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 1));
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: asset.id);

      final result = await sut.getSortedAlbumIds([album.id], aggregation: AssetDateAggregation.start);
      expect(result, [album.id]);
    });

    test('sorts albums by start date (MIN) ascending', () async {
      // Album 1: Assets from Jan 10 to Jan 20 (start: Jan 10)
      final album1 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 10));
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 20));
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset2.id);

      // Album 2: Assets from Jan 5 to Jan 15 (start: Jan 5)
      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 5));
      final asset4 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 15));
      await ctx.newRemoteAlbumAsset(albumId: album2.id, assetId: asset3.id);
      await ctx.newRemoteAlbumAsset(albumId: album2.id, assetId: asset4.id);

      // Album 3: Assets from Jan 25 to Jan 30 (start: Jan 25)
      final album3 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset5 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 25));
      final asset6 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 30));
      await ctx.newRemoteAlbumAsset(albumId: album3.id, assetId: asset5.id);
      await ctx.newRemoteAlbumAsset(albumId: album3.id, assetId: asset6.id);

      final result = await sut.getSortedAlbumIds([
        album1.id,
        album2.id,
        album3.id,
      ], aggregation: AssetDateAggregation.start);

      // Expected order: album2 (Jan 5), album1 (Jan 10), album3 (Jan 25)
      expect(result, [album2.id, album1.id, album3.id]);
    });

    test('sorts albums by end date (MAX) ascending', () async {
      // Album 1: Assets from Jan 10 to Jan 20 (end: Jan 20)
      final album1 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 10));
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 20));
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset2.id);

      // Album 2: Assets from Jan 5 to Jan 15 (end: Jan 15)
      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 5));
      final asset4 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 15));
      await ctx.newRemoteAlbumAsset(albumId: album2.id, assetId: asset3.id);
      await ctx.newRemoteAlbumAsset(albumId: album2.id, assetId: asset4.id);

      // Album 3: Assets from Jan 25 to Jan 30 (end: Jan 30)
      final album3 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset5 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 25));
      final asset6 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 30));
      await ctx.newRemoteAlbumAsset(albumId: album3.id, assetId: asset5.id);
      await ctx.newRemoteAlbumAsset(albumId: album3.id, assetId: asset6.id);

      final result = await sut.getSortedAlbumIds([
        album1.id,
        album2.id,
        album3.id,
      ], aggregation: AssetDateAggregation.end);

      // Expected order: album2 (Jan 15), album1 (Jan 20), album3 (Jan 30)
      expect(result, [album2.id, album1.id, album3.id]);
    });

    test('handles albums with single asset', () async {
      final album1 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 15));
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);

      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 10));
      await ctx.newRemoteAlbumAsset(albumId: album2.id, assetId: asset2.id);

      final result = await sut.getSortedAlbumIds([album1.id, album2.id], aggregation: AssetDateAggregation.start);

      expect(result, [album2.id, album1.id]);
    });

    test('only returns requested album IDs in the result', () async {
      // Create 3 albums
      final album1 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 10));
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);

      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 5));
      await ctx.newRemoteAlbumAsset(albumId: album2.id, assetId: asset2.id);

      final album3 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 15));
      await ctx.newRemoteAlbumAsset(albumId: album3.id, assetId: asset3.id);

      // Only request album1 and album3
      final result = await sut.getSortedAlbumIds([album1.id, album3.id], aggregation: AssetDateAggregation.start);

      // Should only return album1 and album3, not album2
      expect(result, [album1.id, album3.id]);
    });

    test('handles albums with same date correctly', () async {
      final sameDate = DateTime(2024, 1, 10);

      final album1 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: sameDate);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);

      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: sameDate);
      await ctx.newRemoteAlbumAsset(albumId: album2.id, assetId: asset2.id);

      final result = await sut.getSortedAlbumIds([album1.id, album2.id], aggregation: AssetDateAggregation.start);

      // Both albums have the same date, so both should be returned
      expect(result, hasLength(2));
      expect(result, containsAll([album1.id, album2.id]));
    });

    test('handles albums across different years', () async {
      final album1 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2023, 12, 25));
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);

      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 5));
      await ctx.newRemoteAlbumAsset(albumId: album2.id, assetId: asset2.id);

      final album3 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2025, 1, 1));
      await ctx.newRemoteAlbumAsset(albumId: album3.id, assetId: asset3.id);

      final result = await sut.getSortedAlbumIds([
        album1.id,
        album2.id,
        album3.id,
      ], aggregation: AssetDateAggregation.start);

      expect(result, [album1.id, album2.id, album3.id]);
    });

    test('handles album with multiple assets correctly', () async {
      final album1 = await ctx.newRemoteAlbum(ownerId: userId);
      // Album 1 has 5 assets from Jan 5 to Jan 25
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 5));
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 10));
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 15));
      final asset4 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 20));
      final asset5 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 25));
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset2.id);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset3.id);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset4.id);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: asset5.id);

      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset6 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 1));
      await ctx.newRemoteAlbumAsset(albumId: album2.id, assetId: asset6.id);

      final resultStart = await sut.getSortedAlbumIds([album1.id, album2.id], aggregation: AssetDateAggregation.start);

      // album2 (Jan 1) should come before album1 (Jan 5)
      expect(resultStart, [album2.id, album1.id]);

      final resultEnd = await sut.getSortedAlbumIds([album1.id, album2.id], aggregation: AssetDateAggregation.end);

      // album2 (Jan 1) should come before album1 (Jan 25)
      expect(resultEnd, [album2.id, album1.id]);
    });

    test('ignores trashed, hidden, and locked assets when sorting albums by date', () async {
      // Album 1: active asset at Jan 20, trashed asset at Jan 1, hidden asset at Jan 2
      final album1 = await ctx.newRemoteAlbum(ownerId: userId);
      final trashedEarly = await ctx.newRemoteAsset(
        ownerId: userId,
        createdAt: DateTime(2024, 1, 1),
        deletedAt: DateTime(2025, 1, 1),
      );
      final hiddenEarly = await ctx.newRemoteAsset(
        ownerId: userId,
        createdAt: DateTime(2024, 1, 2),
        visibility: AssetVisibility.hidden,
      );
      final active1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 20));
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: trashedEarly.id);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: hiddenEarly.id);
      await ctx.newRemoteAlbumAsset(albumId: album1.id, assetId: active1.id);

      // Album 2: one active asset at Jan 10 (earlier than album1's active asset)
      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final active2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 10));
      await ctx.newRemoteAlbumAsset(albumId: album2.id, assetId: active2.id);

      final result = await sut.getSortedAlbumIds([album1.id, album2.id], aggregation: AssetDateAggregation.start);

      // album2 (Jan 10) should come before album1 (Jan 20, ignoring trashed Jan 1 and hidden Jan 2)
      expect(result, [album2.id, album1.id]);
    });
  });
}

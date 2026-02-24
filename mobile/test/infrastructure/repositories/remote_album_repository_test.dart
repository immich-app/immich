import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';

import '../../medium/repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftRemoteAlbumRepository sut;

  setUp(() async {
    ctx = MediumRepositoryContext();
    sut = DriftRemoteAlbumRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
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
      await ctx.insertRemoteAlbumAsset(albumId: album.id, assetId: asset.id);

      final result = await sut.getSortedAlbumIds([album.id], aggregation: AssetDateAggregation.start);
      expect(result, [album.id]);
    });

    test('sorts albums by start date (MIN) ascending', () async {
      // Album 1: Assets from Jan 10 to Jan 20 (start: Jan 10)
      final album1 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 10));
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 20));
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset2.id);

      // Album 2: Assets from Jan 5 to Jan 15 (start: Jan 5)
      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 5));
      final asset4 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 15));
      await ctx.insertRemoteAlbumAsset(albumId: album2.id, assetId: asset3.id);
      await ctx.insertRemoteAlbumAsset(albumId: album2.id, assetId: asset4.id);

      // Album 3: Assets from Jan 25 to Jan 30 (start: Jan 25)
      final album3 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset5 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 25));
      final asset6 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 30));
      await ctx.insertRemoteAlbumAsset(albumId: album3.id, assetId: asset5.id);
      await ctx.insertRemoteAlbumAsset(albumId: album3.id, assetId: asset6.id);

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
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset2.id);

      // Album 2: Assets from Jan 5 to Jan 15 (end: Jan 15)
      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 5));
      final asset4 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 15));
      await ctx.insertRemoteAlbumAsset(albumId: album2.id, assetId: asset3.id);
      await ctx.insertRemoteAlbumAsset(albumId: album2.id, assetId: asset4.id);

      // Album 3: Assets from Jan 25 to Jan 30 (end: Jan 30)
      final album3 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset5 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 25));
      final asset6 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 30));
      await ctx.insertRemoteAlbumAsset(albumId: album3.id, assetId: asset5.id);
      await ctx.insertRemoteAlbumAsset(albumId: album3.id, assetId: asset6.id);

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
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);

      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 10));
      await ctx.insertRemoteAlbumAsset(albumId: album2.id, assetId: asset2.id);

      final result = await sut.getSortedAlbumIds([album1.id, album2.id], aggregation: AssetDateAggregation.start);

      expect(result, [album2.id, album1.id]);
    });

    test('only returns requested album IDs in the result', () async {
      // Create 3 albums
      final album1 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 10));
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);

      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 5));
      await ctx.insertRemoteAlbumAsset(albumId: album2.id, assetId: asset2.id);

      final album3 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 15));
      await ctx.insertRemoteAlbumAsset(albumId: album3.id, assetId: asset3.id);

      // Only request album1 and album3
      final result = await sut.getSortedAlbumIds([album1.id, album3.id], aggregation: AssetDateAggregation.start);

      // Should only return album1 and album3, not album2
      expect(result, [album1.id, album3.id]);
    });

    test('handles albums with same date correctly', () async {
      final sameDate = DateTime(2024, 1, 10);

      final album1 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: sameDate);
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);

      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: sameDate);
      await ctx.insertRemoteAlbumAsset(albumId: album2.id, assetId: asset2.id);

      final result = await sut.getSortedAlbumIds([album1.id, album2.id], aggregation: AssetDateAggregation.start);

      // Both albums have the same date, so both should be returned
      expect(result, hasLength(2));
      expect(result, containsAll([album1.id, album2.id]));
    });

    test('handles albums across different years', () async {
      final album1 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2023, 12, 25));
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);

      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 5));
      await ctx.insertRemoteAlbumAsset(albumId: album2.id, assetId: asset2.id);

      final album3 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2025, 1, 1));
      await ctx.insertRemoteAlbumAsset(albumId: album3.id, assetId: asset3.id);

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
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset1.id);
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset2.id);
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset3.id);
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset4.id);
      await ctx.insertRemoteAlbumAsset(albumId: album1.id, assetId: asset5.id);

      final album2 = await ctx.newRemoteAlbum(ownerId: userId);
      final asset6 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2024, 1, 1));
      await ctx.insertRemoteAlbumAsset(albumId: album2.id, assetId: asset6.id);

      final resultStart = await sut.getSortedAlbumIds([album1.id, album2.id], aggregation: AssetDateAggregation.start);

      // album2 (Jan 1) should come before album1 (Jan 5)
      expect(resultStart, [album2.id, album1.id]);

      final resultEnd = await sut.getSortedAlbumIds([album1.id, album2.id], aggregation: AssetDateAggregation.end);

      // album2 (Jan 1) should come before album1 (Jan 25)
      expect(resultEnd, [album2.id, album1.id]);
    });
  });
}

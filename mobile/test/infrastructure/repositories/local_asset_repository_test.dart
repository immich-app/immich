import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/utils/option.dart';

import '../../medium/repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftLocalAssetRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = DriftLocalAssetRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('getRemovalCandidates', () {
    final cutoffDate = DateTime(2024, 1, 1);
    final beforeCutoff = DateTime(2023, 12, 31);
    final afterCutoff = DateTime(2024, 1, 2);
    late String userId;

    setUp(() async {
      final user = await ctx.newUser();
      userId = user.id;
    });

    test('returns only assets that match all criteria', () async {
      final otherUser = await ctx.newUser();

      // Asset 1: Should be included - backed up, before cutoff, correct owner, not deleted, not favorite
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final includedAsset = await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);

      // Asset 2: Should NOT be included - not backed up (no remote asset)
      await ctx.newLocalAsset(createdAt: beforeCutoff);

      // Asset 3: Should NOT be included - after cutoff date
      await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: afterCutoff);

      // Asset 4: Should NOT be included - different owner
      final otherRemoteAsset = await ctx.newRemoteAsset(ownerId: otherUser.id);
      await ctx.newLocalAsset(checksum: otherRemoteAsset.checksum, createdAt: beforeCutoff);

      // Asset 5: Should NOT be included - remote asset is deleted
      final deletedAsset = await ctx.newRemoteAsset(ownerId: userId, deletedAt: DateTime(2024, 1, 1));
      await ctx.newLocalAsset(checksum: deletedAsset.checksum, createdAt: beforeCutoff);

      // Asset 6: Should NOT be included - is favorite (when keepFavorites=true)
      final favoriteAsset = await ctx.newRemoteAsset(ownerId: userId, isFavorite: true);
      await ctx.newLocalAsset(checksum: favoriteAsset.checksum, createdAt: beforeCutoff, isFavorite: true);

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepFavorites: true);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, includedAsset.id);
    });

    test('includes favorites when keepFavorites is false', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final favoriteAsset = await ctx.newLocalAsset(
        checksum: remoteAsset.checksum,
        createdAt: beforeCutoff,
        isFavorite: true,
      );

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepFavorites: false);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, favoriteAsset.id);
      expect(result.assets.first.isFavorite, true);
    });

    test('excludes asset when both local and remote are favorites', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId, isFavorite: true);
      await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff, isFavorite: true);

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepFavorites: true);
      expect(result.assets, isEmpty);
    });

    test('excludes asset when only local is favorite', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff, isFavorite: true);

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepFavorites: true);
      expect(result.assets, isEmpty);
    });

    test('excludes asset when only remote is favorite', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId, isFavorite: true);
      await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepFavorites: true);
      expect(result.assets, isEmpty);
    });

    test('includes asset when neither local nor remote is favorite', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final localAsset = await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepFavorites: true);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, localAsset.id);
    });

    test('keepMediaType photosOnly returns only videos for deletion', () async {
      final photoAsset = await ctx.newRemoteAsset(ownerId: userId);
      // Photo - should be kept
      await ctx.newLocalAsset(checksum: photoAsset.checksum, createdAt: beforeCutoff);

      final videoRemoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      // Video - should be deleted
      final videoLocalAsset = await ctx.newLocalAsset(
        checksum: videoRemoteAsset.checksum,
        createdAt: beforeCutoff,
        type: AssetType.video,
      );

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepMediaType: AssetKeepType.photosOnly);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, videoLocalAsset.id);
      expect(result.assets.first.type, AssetType.video);
    });

    test('keepMediaType videosOnly returns only photos for deletion', () async {
      // Photo - should be deleted
      final photoRemoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final photoAsset = await ctx.newLocalAsset(checksum: photoRemoteAsset.checksum, createdAt: beforeCutoff);

      // Video - should be kept
      final videoRemoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      await ctx.newLocalAsset(checksum: videoRemoteAsset.checksum, createdAt: beforeCutoff, type: AssetType.video);

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepMediaType: AssetKeepType.videosOnly);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, photoAsset.id);
      expect(result.assets.first.type, AssetType.image);
    });

    test('returns both photos and videos with keepMediaType.all', () async {
      // Photo
      final photoRemoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final photoAsset = await ctx.newLocalAsset(checksum: photoRemoteAsset.checksum, createdAt: beforeCutoff);

      // Video
      final videoRemoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final videoAsset = await ctx.newLocalAsset(
        checksum: videoRemoteAsset.checksum,
        createdAt: beforeCutoff,
        type: AssetType.video,
      );

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepMediaType: AssetKeepType.none);
      expect(result.assets.length, 2);
      final ids = result.assets.map((a) => a.id).toSet();
      expect(ids, containsAll([photoAsset.id, videoAsset.id]));
    });

    test('excludes assets in iOS shared albums', () async {
      // Regular album
      final regularAlbum = await ctx.newLocalAlbum();

      // iOS shared album
      final sharedAlbum = await ctx.newLocalAlbum(isIosSharedAlbum: true);

      // Asset in regular album (should be included)
      final regularRemoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final regularAsset = await ctx.newLocalAsset(checksum: regularRemoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAlbumAsset(albumId: regularAlbum.id, assetId: regularAsset.id);

      // Asset in iOS shared album (should be excluded)
      final sharedRemoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final sharedAsset = await ctx.newLocalAsset(checksum: sharedRemoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAlbumAsset(albumId: sharedAlbum.id, assetId: sharedAsset.id);

      final result = await sut.getRemovalCandidates(userId, cutoffDate);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, regularAsset.id);
    });

    test('includes assets at exact cutoff date', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final localAsset = await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: cutoffDate);

      final result = await sut.getRemovalCandidates(userId, cutoffDate);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, localAsset.id);
    });

    test('returns empty list when no assets match criteria', () async {
      // Only assets after cutoff
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: afterCutoff);

      final result = await sut.getRemovalCandidates(userId, cutoffDate);
      expect(result.assets, isEmpty);
    });

    test('handles multiple assets with same checksum', () async {
      // Two local assets with same checksum (edge case, but should handle it)
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);

      final result = await sut.getRemovalCandidates(userId, cutoffDate);
      expect(result.assets.length, 2);
      expect(result.assets.map((a) => a.checksum).toSet(), equals({remoteAsset.checksum}));
    });

    test('includes assets not in any album', () async {
      // Asset not in any album should be included
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final localAsset = await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);

      final result = await sut.getRemovalCandidates(userId, cutoffDate);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, localAsset.id);
    });

    test('excludes asset that is in both regular and iOS shared album', () async {
      // Regular album
      final regularAlbum = await ctx.newLocalAlbum();

      // iOS shared album
      final sharedAlbum = await ctx.newLocalAlbum(isIosSharedAlbum: true);

      // Asset in BOTH albums - should be excluded because it's in an iOS shared album
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final localAsset = await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAlbumAsset(albumId: regularAlbum.id, assetId: localAsset.id);
      await ctx.newLocalAlbumAsset(albumId: sharedAlbum.id, assetId: localAsset.id);

      final result = await sut.getRemovalCandidates(userId, cutoffDate);
      expect(result.assets, isEmpty);
    });

    test('excludes assets with null checksum (not backed up)', () async {
      // Asset with null checksum cannot be matched to remote asset
      await ctx.newLocalAsset(checksumOption: const Option.none());

      final result = await sut.getRemovalCandidates(userId, cutoffDate);
      expect(result.assets, isEmpty);
    });

    test('excludes assets in user-excluded albums', () async {
      // Create two regular albums
      final includeAlbum = await ctx.newLocalAlbum();
      final excludeAlbum = await ctx.newLocalAlbum();

      // Asset in included album - should be included
      final includedRemoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final includedAsset = await ctx.newLocalAsset(checksum: includedRemoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAlbumAsset(albumId: includeAlbum.id, assetId: includedAsset.id);

      // Asset in excluded album - should NOT be included
      final excludedRemoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final excludedAsset = await ctx.newLocalAsset(checksum: excludedRemoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAlbumAsset(albumId: excludeAlbum.id, assetId: excludedAsset.id);

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepAlbumIds: {excludeAlbum.id});

      expect(result.assets.length, 1);
      expect(result.assets.first.id, includedAsset.id);
    });

    test('excludes assets that are in any of multiple excluded albums', () async {
      // Create multiple albums
      final album1 = await ctx.newLocalAlbum();
      final album2 = await ctx.newLocalAlbum();
      final album3 = await ctx.newLocalAlbum();

      // Asset in album-1 (excluded) - should NOT be included
      final remote1 = await ctx.newRemoteAsset(ownerId: userId);
      final local1 = await ctx.newLocalAsset(checksum: remote1.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAlbumAsset(albumId: album1.id, assetId: local1.id);

      // Asset in album-2 (excluded) - should NOT be included
      final remote2 = await ctx.newRemoteAsset(ownerId: userId);
      final local2 = await ctx.newLocalAsset(checksum: remote2.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAlbumAsset(albumId: album2.id, assetId: local2.id);

      // Asset in album-3 (not excluded) - should be included
      final remote3 = await ctx.newRemoteAsset(ownerId: userId);
      final local3 = await ctx.newLocalAsset(checksum: remote3.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAlbumAsset(albumId: album3.id, assetId: local3.id);

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepAlbumIds: {album1.id, album2.id});
      expect(result.assets.length, 1);
      expect(result.assets.first.id, local3.id);
    });

    test('excludes asset that is in both excluded and non-excluded album', () async {
      final includedAlbum = await ctx.newLocalAlbum();
      final excludedAlbum = await ctx.newLocalAlbum();

      // Asset in BOTH albums - should be excluded because it's in an excluded album
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final localAsset = await ctx.newLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAlbumAsset(albumId: includedAlbum.id, assetId: localAsset.id);
      await ctx.newLocalAlbumAsset(albumId: excludedAlbum.id, assetId: localAsset.id);

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepAlbumIds: {excludedAlbum.id});
      expect(result.assets, isEmpty);
    });

    test('includes all assets when excludedAlbumIds is empty', () async {
      final album1 = await ctx.newLocalAlbum();

      final remote1 = await ctx.newRemoteAsset(ownerId: userId);
      final local1 = await ctx.newLocalAsset(checksum: remote1.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAlbumAsset(albumId: album1.id, assetId: local1.id);

      final remote2 = await ctx.newRemoteAsset(ownerId: userId);
      await ctx.newLocalAsset(checksum: remote2.checksum, createdAt: beforeCutoff);

      // Empty excludedAlbumIds should include all eligible assets
      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepAlbumIds: {});
      expect(result.assets.length, 2);
    });

    test('excludes asset not in any album when album is excluded', () async {
      final excludedAlbum = await ctx.newLocalAlbum();

      // Asset NOT in any album - should be included
      final noAlbumRemote = await ctx.newRemoteAsset(ownerId: userId);
      final noAlbumAsset = await ctx.newLocalAsset(checksum: noAlbumRemote.checksum, createdAt: beforeCutoff);

      // Asset in excluded album - should NOT be included
      final excludedRemote = await ctx.newRemoteAsset(ownerId: userId);
      final excludedAsset = await ctx.newLocalAsset(checksum: excludedRemote.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAlbumAsset(albumId: excludedAlbum.id, assetId: excludedAsset.id);

      final result = await sut.getRemovalCandidates(userId, cutoffDate, keepAlbumIds: {excludedAlbum.id});
      expect(result.assets.length, 1);
      expect(result.assets.first.id, noAlbumAsset.id);
    });

    test('combines excludedAlbumIds with keepMediaType correctly', () async {
      final excludedAlbum = await ctx.newLocalAlbum();
      final regularAlbum = await ctx.newLocalAlbum();

      // Photo in excluded album - should NOT be included (album excluded)
      final photoExcludedRemote = await ctx.newRemoteAsset(ownerId: userId);
      final photoExcludedAsset = await ctx.newLocalAsset(
        checksum: photoExcludedRemote.checksum,
        createdAt: beforeCutoff,
      );
      await ctx.newLocalAlbumAsset(albumId: excludedAlbum.id, assetId: photoExcludedAsset.id);

      // Video in regular album - should be included (keepMediaType photosOnly = delete videos)
      final videoRemote = await ctx.newRemoteAsset(ownerId: userId);
      final videoAsset = await ctx.newLocalAsset(
        checksum: videoRemote.checksum,
        createdAt: beforeCutoff,
        type: AssetType.video,
      );
      await ctx.newLocalAlbumAsset(albumId: regularAlbum.id, assetId: videoAsset.id);

      // Photo in regular album - should NOT be included (keepMediaType photosOnly = keep photos)
      final photoRegularRemote = await ctx.newRemoteAsset(ownerId: userId);
      final photoRegularAsset = await ctx.newLocalAsset(checksum: photoRegularRemote.checksum, createdAt: beforeCutoff);
      await ctx.newLocalAlbumAsset(albumId: regularAlbum.id, assetId: photoRegularAsset.id);

      final result = await sut.getRemovalCandidates(
        userId,
        cutoffDate,
        keepMediaType: AssetKeepType.photosOnly,
        keepAlbumIds: {excludedAlbum.id},
      );

      expect(result.assets.length, 1);
      expect(result.assets.first.id, videoAsset.id);
    });
  });

  group('reconcileHashesFromCloudId', () {
    late String userId;

    setUp(() async {
      final user = await ctx.newUser();
      userId = user.id;
    });

    test('updates local asset checksum when all metadata matches', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final remoteCloudAsset = await ctx.newRemoteAssetCloudId(id: remoteAsset.id);
      final localAsset = await ctx.newLocalAsset(
        checksumOption: const Option.none(),
        iCloudId: remoteCloudAsset.cloudId,
        createdAt: remoteCloudAsset.createdAt,
        adjustmentTime: remoteCloudAsset.adjustmentTime,
        latitude: remoteCloudAsset.latitude,
        longitude: remoteCloudAsset.longitude,
      );

      await sut.reconcileHashesFromCloudId();
      final updated = await sut.getById(localAsset.id);
      expect(updated?.checksum, remoteAsset.checksum);
    });

    test('does not update when local asset already has checksum', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final remoteCloudAsset = await ctx.newRemoteAssetCloudId(id: remoteAsset.id);

      final localAsset = await ctx.newLocalAsset(
        checksum: 'existing',
        iCloudId: remoteCloudAsset.cloudId,
        createdAt: remoteCloudAsset.createdAt,
        adjustmentTime: remoteCloudAsset.adjustmentTime,
        latitude: remoteCloudAsset.latitude,
        longitude: remoteCloudAsset.longitude,
      );

      await sut.reconcileHashesFromCloudId();
      final updated = await sut.getById(localAsset.id);
      expect(updated?.checksum, 'existing');
    });

    test('does not update when adjustment_time does not match', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final cloudIdAsset = await ctx.newRemoteAssetCloudId(id: remoteAsset.id, adjustmentTime: DateTime(2024, 1, 12));
      final localAsset = await ctx.newLocalAsset(
        checksumOption: const Option.none(),
        iCloudId: cloudIdAsset.cloudId,
        createdAt: cloudIdAsset.createdAt,
        adjustmentTime: DateTime(2026, 1, 12),
        latitude: cloudIdAsset.latitude,
        longitude: cloudIdAsset.longitude,
      );

      await sut.reconcileHashesFromCloudId();
      final updated = await sut.getById(localAsset.id);
      expect(updated?.checksum, isNull);
    });

    test('does not update when latitude does not match', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final cloudIdAsset = await ctx.newRemoteAssetCloudId(id: remoteAsset.id, latitude: const Option.none());
      final localAsset = await ctx.newLocalAsset(
        checksumOption: const Option.none(),
        iCloudId: cloudIdAsset.cloudId,
        createdAt: cloudIdAsset.createdAt,
        adjustmentTime: cloudIdAsset.adjustmentTime,
        latitude: 40.7128,
        longitude: cloudIdAsset.longitude,
      );

      await sut.reconcileHashesFromCloudId();
      final updated = await sut.getById(localAsset.id);
      expect(updated?.checksum, isNull);
    });

    test('does not update when longitude does not match', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final cloudIdAsset = await ctx.newRemoteAssetCloudId(id: remoteAsset.id, longitude: (-74.006).toOption());
      final localAsset = await ctx.newLocalAsset(
        checksumOption: const Option.none(),
        iCloudId: cloudIdAsset.cloudId,
        createdAt: cloudIdAsset.createdAt,
        adjustmentTime: cloudIdAsset.adjustmentTime,
        latitude: cloudIdAsset.latitude,
        longitude: 0.0,
      );

      await sut.reconcileHashesFromCloudId();
      final updated = await sut.getById(localAsset.id);
      expect(updated?.checksum, isNull);
    });

    test('does not update when createdAt does not match', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final cloudIdAsset = await ctx.newRemoteAssetCloudId(id: remoteAsset.id, createdAt: DateTime(2024, 1, 5));
      final localAsset = await ctx.newLocalAsset(
        checksumOption: const Option.none(),
        iCloudId: cloudIdAsset.cloudId,
        createdAt: DateTime(2024, 6, 1),
        adjustmentTime: cloudIdAsset.adjustmentTime,
        latitude: cloudIdAsset.latitude,
        longitude: cloudIdAsset.longitude,
      );

      await sut.reconcileHashesFromCloudId();
      final updated = await sut.getById(localAsset.id);
      expect(updated?.checksum, isNull);
    });

    test('does not update when iCloudId is null', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final cloudIdAsset = await ctx.newRemoteAssetCloudId(id: remoteAsset.id);
      final localAsset = await ctx.newLocalAsset(
        checksumOption: const Option.none(),
        iCloudId: null,
        createdAt: cloudIdAsset.createdAt,
        adjustmentTime: cloudIdAsset.adjustmentTime,
        latitude: cloudIdAsset.latitude,
        longitude: cloudIdAsset.longitude,
      );

      await sut.reconcileHashesFromCloudId();
      final updated = await sut.getById(localAsset.id);
      expect(updated?.checksum, isNull);
    });

    test('does not update when cloudId does not match iCloudId', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final cloudIdAsset = await ctx.newRemoteAssetCloudId(id: remoteAsset.id);
      final localAsset = await ctx.newLocalAsset(
        checksumOption: const Option.none(),
        iCloudId: 'different-cloud-id',
        createdAt: cloudIdAsset.createdAt,
        adjustmentTime: cloudIdAsset.adjustmentTime,
        latitude: cloudIdAsset.latitude,
        longitude: cloudIdAsset.longitude,
      );

      await sut.reconcileHashesFromCloudId();
      final updated = await sut.getById(localAsset.id);
      expect(updated?.checksum, isNull);
    });

    test('handles partial null metadata fields matching correctly', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final cloudIdAsset = await ctx.newRemoteAssetCloudId(
        id: remoteAsset.id,
        adjustmentTimeOption: const Option.none(),
      );
      final localAsset = await ctx.newLocalAsset(
        checksumOption: const Option.none(),
        iCloudId: cloudIdAsset.cloudId,
        createdAt: cloudIdAsset.createdAt,
        adjustmentTimeOption: const Option.none(),
        latitude: cloudIdAsset.latitude,
        longitude: cloudIdAsset.longitude,
      );

      await sut.reconcileHashesFromCloudId();
      final updated = await sut.getById(localAsset.id);
      expect(updated?.checksum, remoteAsset.checksum);
    });

    test('does not update when one has null and other has value', () async {
      final remoteAsset = await ctx.newRemoteAsset(ownerId: userId);
      final cloudIdAsset = await ctx.newRemoteAssetCloudId(id: remoteAsset.id);
      final localAsset = await ctx.newLocalAsset(
        checksumOption: const Option.none(),
        iCloudId: cloudIdAsset.cloudId,
        createdAt: cloudIdAsset.createdAt,
        adjustmentTime: cloudIdAsset.adjustmentTime,
        latitude: null,
        longitude: cloudIdAsset.longitude,
      );

      await sut.reconcileHashesFromCloudId();
      final updated = await sut.getById(localAsset.id);
      expect(updated?.checksum, isNull);
    });

    test('handles no matching assets gracefully', () async {
      final localAsset = await ctx.newLocalAsset(checksumOption: const Option.none(), iCloudId: 'cloud-no-match');

      await sut.reconcileHashesFromCloudId();
      final updated = await sut.getById(localAsset.id);
      expect(updated?.checksum, isNull);
    });
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/utils/option.dart';

import '../../medium/repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftLocalAssetRepository sut;

  setUp(() async {
    ctx = await MediumRepositoryContext.create();
    sut = DriftLocalAssetRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('getRemovalCandidates', () {
    final cutoffDate = DateTime(2024, 1, 1);
    final beforeCutoff = DateTime(2023, 12, 31);
    final afterCutoff = DateTime(2024, 1, 2);
    late UserEntityData user;

    setUp(() {
      user = ctx.user;
    });

    test('returns only assets that match all criteria', () async {
      final otherUser = await ctx.insertUser();

      // Asset 1: Should be included - backed up, before cutoff, correct owner, not deleted, not favorite
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final includedAsset = await ctx.insertLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);

      // Asset 2: Should NOT be included - not backed up (no remote asset)
      await ctx.insertLocalAsset(createdAt: beforeCutoff);

      // Asset 3: Should NOT be included - after cutoff date
      await ctx.insertLocalAsset(checksum: remoteAsset.checksum, createdAt: afterCutoff);

      // Asset 4: Should NOT be included - different owner
      final otherRemoteAsset = await ctx.insertRemoteAsset(ownerId: otherUser.id);
      await ctx.insertLocalAsset(checksum: otherRemoteAsset.checksum, createdAt: beforeCutoff);

      // Asset 5: Should NOT be included - remote asset is deleted
      final deletedAsset = await ctx.insertRemoteAsset(ownerId: user.id, deletedAt: DateTime(2024, 1, 1));
      await ctx.insertLocalAsset(checksum: deletedAsset.checksum, createdAt: beforeCutoff);

      // Asset 6: Should NOT be included - is favorite (when keepFavorites=true)
      final favoriteAsset = await ctx.insertRemoteAsset(ownerId: user.id, isFavorite: true);
      await ctx.insertLocalAsset(checksum: favoriteAsset.checksum, createdAt: beforeCutoff, isFavorite: true);

      final result = await sut.getRemovalCandidates(user.id, cutoffDate, keepFavorites: true);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, includedAsset.id);
    });

    test('includes favorites when keepFavorites is false', () async {
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final favoriteAsset = await ctx.insertLocalAsset(
        checksum: remoteAsset.checksum,
        createdAt: beforeCutoff,
        isFavorite: true,
      );

      final result = await sut.getRemovalCandidates(user.id, cutoffDate, keepFavorites: false);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, favoriteAsset.id);
      expect(result.assets.first.isFavorite, true);
    });

    test('keepMediaType photosOnly returns only videos for deletion', () async {
      final photoAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      // Photo - should be kept
      await ctx.insertLocalAsset(checksum: photoAsset.checksum, createdAt: beforeCutoff);

      final videoRemoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      // Video - should be deleted
      final videoLocalAsset = await ctx.insertLocalAsset(
        checksum: videoRemoteAsset.checksum,
        createdAt: beforeCutoff,
        type: AssetType.video,
      );

      final result = await sut.getRemovalCandidates(user.id, cutoffDate, keepMediaType: AssetKeepType.photosOnly);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, videoLocalAsset.id);
      expect(result.assets.first.type, AssetType.video);
    });

    test('keepMediaType videosOnly returns only photos for deletion', () async {
      // Photo - should be deleted
      final photoRemoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final photoAsset = await ctx.insertLocalAsset(checksum: photoRemoteAsset.checksum, createdAt: beforeCutoff);

      // Video - should be kept
      final videoRemoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      await ctx.insertLocalAsset(checksum: videoRemoteAsset.checksum, createdAt: beforeCutoff, type: AssetType.video);

      final result = await sut.getRemovalCandidates(user.id, cutoffDate, keepMediaType: AssetKeepType.videosOnly);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, photoAsset.id);
      expect(result.assets.first.type, AssetType.image);
    });

    test('returns both photos and videos with keepMediaType.all', () async {
      // Photo
      final photoRemoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final photoAsset = await ctx.insertLocalAsset(checksum: photoRemoteAsset.checksum, createdAt: beforeCutoff);

      // Video
      final videoRemoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final videoAsset = await ctx.insertLocalAsset(
        checksum: videoRemoteAsset.checksum,
        createdAt: beforeCutoff,
        type: AssetType.video,
      );

      final result = await sut.getRemovalCandidates(user.id, cutoffDate, keepMediaType: AssetKeepType.none);
      expect(result.assets.length, 2);
      final ids = result.assets.map((a) => a.id).toSet();
      expect(ids, containsAll([photoAsset.id, videoAsset.id]));
    });

    test('excludes assets in iOS shared albums', () async {
      // Regular album
      final regularAlbum = await ctx.insertLocalAlbum();

      // iOS shared album
      final sharedAlbum = await ctx.insertLocalAlbum(isIosSharedAlbum: true);

      // Asset in regular album (should be included)
      final regularRemoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final regularAsset = await ctx.insertLocalAsset(checksum: regularRemoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.insertLocalAlbumAsset(albumId: regularAlbum.id, assetId: regularAsset.id);

      // Asset in iOS shared album (should be excluded)
      final sharedRemoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final sharedAsset = await ctx.insertLocalAsset(checksum: sharedRemoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.insertLocalAlbumAsset(albumId: sharedAlbum.id, assetId: sharedAsset.id);

      final result = await sut.getRemovalCandidates(user.id, cutoffDate);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, regularAsset.id);
    });

    test('includes assets at exact cutoff date', () async {
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final localAsset = await ctx.insertLocalAsset(checksum: remoteAsset.checksum, createdAt: cutoffDate);

      final result = await sut.getRemovalCandidates(user.id, cutoffDate);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, localAsset.id);
    });

    test('returns empty list when no assets match criteria', () async {
      // Only assets after cutoff
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      await ctx.insertLocalAsset(checksum: remoteAsset.checksum, createdAt: afterCutoff);

      final result = await sut.getRemovalCandidates(user.id, cutoffDate);
      expect(result.assets, isEmpty);
    });

    test('handles multiple assets with same checksum', () async {
      // Two local assets with same checksum (edge case, but should handle it)
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      await ctx.insertLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.insertLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);

      final result = await sut.getRemovalCandidates(user.id, cutoffDate);
      expect(result.assets.length, 2);
      expect(result.assets.map((a) => a.checksum).toSet(), equals({remoteAsset.checksum}));
    });

    test('includes assets not in any album', () async {
      // Asset not in any album should be included
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final localAsset = await ctx.insertLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);

      final result = await sut.getRemovalCandidates(user.id, cutoffDate);
      expect(result.assets.length, 1);
      expect(result.assets.first.id, localAsset.id);
    });

    test('excludes asset that is in both regular and iOS shared album', () async {
      // Regular album
      final regularAlbum = await ctx.insertLocalAlbum();

      // iOS shared album
      final sharedAlbum = await ctx.insertLocalAlbum(isIosSharedAlbum: true);

      // Asset in BOTH albums - should be excluded because it's in an iOS shared album
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final localAsset = await ctx.insertLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.insertLocalAlbumAsset(albumId: regularAlbum.id, assetId: localAsset.id);
      await ctx.insertLocalAlbumAsset(albumId: sharedAlbum.id, assetId: localAsset.id);

      final result = await sut.getRemovalCandidates(user.id, cutoffDate);
      expect(result.assets, isEmpty);
    });

    test('excludes assets with null checksum (not backed up)', () async {
      // Asset with null checksum cannot be matched to remote asset
      await ctx.insertLocalAsset(checksumOption: const Option.none());

      final result = await sut.getRemovalCandidates(user.id, cutoffDate);
      expect(result.assets, isEmpty);
    });

    test('excludes assets in user-excluded albums', () async {
      // Create two regular albums
      final includeAlbum = await ctx.insertLocalAlbum();
      final excludeAlbum = await ctx.insertLocalAlbum();

      // Asset in included album - should be included
      final includedRemoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final includedAsset = await ctx.insertLocalAsset(checksum: includedRemoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.insertLocalAlbumAsset(albumId: includeAlbum.id, assetId: includedAsset.id);

      // Asset in excluded album - should NOT be included
      final excludedRemoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final excludedAsset = await ctx.insertLocalAsset(checksum: excludedRemoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.insertLocalAlbumAsset(albumId: excludeAlbum.id, assetId: excludedAsset.id);

      final result = await sut.getRemovalCandidates(user.id, cutoffDate, keepAlbumIds: {excludeAlbum.id});

      expect(result.assets.length, 1);
      expect(result.assets.first.id, includedAsset.id);
    });

    test('excludes assets that are in any of multiple excluded albums', () async {
      // Create multiple albums
      final album1 = await ctx.insertLocalAlbum();
      final album2 = await ctx.insertLocalAlbum();
      final album3 = await ctx.insertLocalAlbum();

      // Asset in album-1 (excluded) - should NOT be included
      final remote1 = await ctx.insertRemoteAsset(ownerId: user.id);
      final local1 = await ctx.insertLocalAsset(checksum: remote1.checksum, createdAt: beforeCutoff);
      await ctx.insertLocalAlbumAsset(albumId: album1.id, assetId: local1.id);

      // Asset in album-2 (excluded) - should NOT be included
      final remote2 = await ctx.insertRemoteAsset(ownerId: user.id);
      final local2 = await ctx.insertLocalAsset(checksum: remote2.checksum, createdAt: beforeCutoff);
      await ctx.insertLocalAlbumAsset(albumId: album2.id, assetId: local2.id);

      // Asset in album-3 (not excluded) - should be included
      final remote3 = await ctx.insertRemoteAsset(ownerId: user.id);
      final local3 = await ctx.insertLocalAsset(checksum: remote3.checksum, createdAt: beforeCutoff);
      await ctx.insertLocalAlbumAsset(albumId: album3.id, assetId: local3.id);

      final result = await sut.getRemovalCandidates(user.id, cutoffDate, keepAlbumIds: {album1.id, album2.id});
      expect(result.assets.length, 1);
      expect(result.assets.first.id, local3.id);
    });

    test('excludes asset that is in both excluded and non-excluded album', () async {
      final includedAlbum = await ctx.insertLocalAlbum();
      final excludedAlbum = await ctx.insertLocalAlbum();

      // Asset in BOTH albums - should be excluded because it's in an excluded album
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final localAsset = await ctx.insertLocalAsset(checksum: remoteAsset.checksum, createdAt: beforeCutoff);
      await ctx.insertLocalAlbumAsset(albumId: includedAlbum.id, assetId: localAsset.id);
      await ctx.insertLocalAlbumAsset(albumId: excludedAlbum.id, assetId: localAsset.id);

      final result = await sut.getRemovalCandidates(user.id, cutoffDate, keepAlbumIds: {excludedAlbum.id});
      expect(result.assets, isEmpty);
    });

    test('includes all assets when excludedAlbumIds is empty', () async {
      final album1 = await ctx.insertLocalAlbum();

      final remote1 = await ctx.insertRemoteAsset(ownerId: user.id);
      final local1 = await ctx.insertLocalAsset(checksum: remote1.checksum, createdAt: beforeCutoff);
      await ctx.insertLocalAlbumAsset(albumId: album1.id, assetId: local1.id);

      final remote2 = await ctx.insertRemoteAsset(ownerId: user.id);
      await ctx.insertLocalAsset(checksum: remote2.checksum, createdAt: beforeCutoff);

      // Empty excludedAlbumIds should include all eligible assets
      final result = await sut.getRemovalCandidates(user.id, cutoffDate, keepAlbumIds: {});
      expect(result.assets.length, 2);
    });

    test('excludes asset not in any album when album is excluded', () async {
      final excludedAlbum = await ctx.insertLocalAlbum();

      // Asset NOT in any album - should be included
      final noAlbumRemote = await ctx.insertRemoteAsset(ownerId: user.id);
      final noAlbumAsset = await ctx.insertLocalAsset(checksum: noAlbumRemote.checksum, createdAt: beforeCutoff);

      // Asset in excluded album - should NOT be included
      final excludedRemote = await ctx.insertRemoteAsset(ownerId: user.id);
      final excludedAsset = await ctx.insertLocalAsset(checksum: excludedRemote.checksum, createdAt: beforeCutoff);
      await ctx.insertLocalAlbumAsset(albumId: excludedAlbum.id, assetId: excludedAsset.id);

      final result = await sut.getRemovalCandidates(user.id, cutoffDate, keepAlbumIds: {excludedAlbum.id});
      expect(result.assets.length, 1);
      expect(result.assets.first.id, noAlbumAsset.id);
    });

    test('combines excludedAlbumIds with keepMediaType correctly', () async {
      final excludedAlbum = await ctx.insertLocalAlbum();
      final regularAlbum = await ctx.insertLocalAlbum();

      // Photo in excluded album - should NOT be included (album excluded)
      final photoExcludedRemote = await ctx.insertRemoteAsset(ownerId: user.id);
      final photoExcludedAsset = await ctx.insertLocalAsset(
        checksum: photoExcludedRemote.checksum,
        createdAt: beforeCutoff,
      );
      await ctx.insertLocalAlbumAsset(albumId: excludedAlbum.id, assetId: photoExcludedAsset.id);

      // Video in regular album - should be included (keepMediaType photosOnly = delete videos)
      final videoRemote = await ctx.insertRemoteAsset(ownerId: user.id);
      final videoAsset = await ctx.insertLocalAsset(
        checksum: videoRemote.checksum,
        createdAt: beforeCutoff,
        type: AssetType.video,
      );
      await ctx.insertLocalAlbumAsset(albumId: regularAlbum.id, assetId: videoAsset.id);

      // Photo in regular album - should NOT be included (keepMediaType photosOnly = keep photos)
      final photoRegularRemote = await ctx.insertRemoteAsset(ownerId: user.id);
      final photoRegularAsset = await ctx.insertLocalAsset(
        checksum: photoRegularRemote.checksum,
        createdAt: beforeCutoff,
      );
      await ctx.insertLocalAlbumAsset(albumId: regularAlbum.id, assetId: photoRegularAsset.id);

      final result = await sut.getRemovalCandidates(
        user.id,
        cutoffDate,
        keepMediaType: AssetKeepType.photosOnly,
        keepAlbumIds: {excludedAlbum.id},
      );

      expect(result.assets.length, 1);
      expect(result.assets.first.id, videoAsset.id);
    });
  });

  group('reconcileHashesFromCloudId', () {
    late UserEntityData user;

    setUp(() {
      user = ctx.user;
    });

    test('updates local asset checksum when all metadata matches', () async {
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final remoteCloudAsset = await ctx.insertRemoteAssetCloudId(id: remoteAsset.id);
      final localAsset = await ctx.insertLocalAsset(
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
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final remoteCloudAsset = await ctx.insertRemoteAssetCloudId(id: remoteAsset.id);

      final localAsset = await ctx.insertLocalAsset(
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
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final cloudIdAsset = await ctx.insertRemoteAssetCloudId(
        id: remoteAsset.id,
        adjustmentTime: DateTime(2024, 1, 12),
      );
      final localAsset = await ctx.insertLocalAsset(
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
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final cloudIdAsset = await ctx.insertRemoteAssetCloudId(id: remoteAsset.id, latitude: const Option.none());
      final localAsset = await ctx.insertLocalAsset(
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
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final cloudIdAsset = await ctx.insertRemoteAssetCloudId(id: remoteAsset.id, longitude: (-74.006).toOption());
      final localAsset = await ctx.insertLocalAsset(
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
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final cloudIdAsset = await ctx.insertRemoteAssetCloudId(id: remoteAsset.id, createdAt: DateTime(2024, 1, 5));
      final localAsset = await ctx.insertLocalAsset(
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
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final cloudIdAsset = await ctx.insertRemoteAssetCloudId(id: remoteAsset.id);
      final localAsset = await ctx.insertLocalAsset(
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
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final cloudIdAsset = await ctx.insertRemoteAssetCloudId(id: remoteAsset.id);
      final localAsset = await ctx.insertLocalAsset(
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
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final cloudIdAsset = await ctx.insertRemoteAssetCloudId(
        id: remoteAsset.id,
        adjustmentTimeOption: const Option.none(),
      );
      final localAsset = await ctx.insertLocalAsset(
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
      final remoteAsset = await ctx.insertRemoteAsset(ownerId: user.id);
      final cloudIdAsset = await ctx.insertRemoteAssetCloudId(id: remoteAsset.id);
      final localAsset = await ctx.insertLocalAsset(
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
      final localAsset = await ctx.insertLocalAsset(checksumOption: const Option.none(), iCloudId: 'cloud-no-match');

      await sut.reconcileHashesFromCloudId();
      final updated = await sut.getById(localAsset.id);
      expect(updated?.checksum, isNull);
    });
  });
}

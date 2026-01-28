import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset_cloud_id.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';

void main() {
  final now = DateTime(2024, 1, 15);
  late Drift db;
  late DriftLocalAssetRepository repository;

  setUp(() {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    repository = DriftLocalAssetRepository(db);
  });

  tearDown(() async {
    await db.close();
  });

  Future<void> insertLocalAsset({
    required String id,
    String? checksum,
    DateTime? createdAt,
    AssetType type = AssetType.image,
    bool isFavorite = false,
    String? iCloudId,
    DateTime? adjustmentTime,
    double? latitude,
    double? longitude,
  }) async {
    final created = createdAt ?? now;
    await db
        .into(db.localAssetEntity)
        .insert(
          LocalAssetEntityCompanion.insert(
            id: id,
            name: 'asset_$id.jpg',
            checksum: Value(checksum),
            type: type,
            createdAt: Value(created),
            updatedAt: Value(created),
            isFavorite: Value(isFavorite),
            iCloudId: Value(iCloudId),
            adjustmentTime: Value(adjustmentTime),
            latitude: Value(latitude),
            longitude: Value(longitude),
          ),
        );
  }

  Future<void> insertRemoteAsset({
    required String id,
    required String checksum,
    required String ownerId,
    DateTime? deletedAt,
  }) async {
    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: id,
            name: 'remote_$id.jpg',
            checksum: checksum,
            type: AssetType.image,
            createdAt: Value(now),
            updatedAt: Value(now),
            ownerId: ownerId,
            visibility: AssetVisibility.timeline,
            deletedAt: Value(deletedAt),
          ),
        );
  }

  Future<void> insertRemoteAssetCloudId({
    required String assetId,
    required String? cloudId,
    DateTime? createdAt,
    DateTime? adjustmentTime,
    double? latitude,
    double? longitude,
  }) async {
    await db
        .into(db.remoteAssetCloudIdEntity)
        .insert(
          RemoteAssetCloudIdEntityCompanion.insert(
            assetId: assetId,
            cloudId: Value(cloudId),
            createdAt: Value(createdAt),
            adjustmentTime: Value(adjustmentTime),
            latitude: Value(latitude),
            longitude: Value(longitude),
          ),
        );
  }

  Future<void> insertUser(String id, String email) async {
    await db.into(db.userEntity).insert(UserEntityCompanion.insert(id: id, email: email, name: email));
  }

  group('getRemovalCandidates', () {
    final userId = 'user-123';
    final otherUserId = 'user-456';
    final cutoffDate = DateTime(2024, 1, 10);
    final beforeCutoff = DateTime(2024, 1, 5);
    final afterCutoff = DateTime(2024, 1, 12);

    setUp(() async {
      await insertUser(userId, 'user@test.com');
      await insertUser(otherUserId, 'other@test.com');
    });

    Future<void> insertLocalAlbum({required String id, required String name, required bool isIosSharedAlbum}) async {
      await db
          .into(db.localAlbumEntity)
          .insert(
            LocalAlbumEntityCompanion.insert(
              id: id,
              name: name,
              updatedAt: Value(now),
              backupSelection: BackupSelection.none,
              isIosSharedAlbum: Value(isIosSharedAlbum),
            ),
          );
    }

    Future<void> insertLocalAlbumAsset({required String albumId, required String assetId}) async {
      await db
          .into(db.localAlbumAssetEntity)
          .insert(LocalAlbumAssetEntityCompanion.insert(albumId: albumId, assetId: assetId));
    }

    test('returns only assets that match all criteria', () async {
      // Asset 1: Should be included - backed up, before cutoff, correct owner, not deleted, not favorite
      await insertLocalAsset(
        id: 'local-1',
        checksum: 'checksum-1',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-1', checksum: 'checksum-1', ownerId: userId);

      // Asset 2: Should NOT be included - not backed up (no remote asset)
      await insertLocalAsset(
        id: 'local-2',
        checksum: 'checksum-2',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );

      // Asset 3: Should NOT be included - after cutoff date
      await insertLocalAsset(
        id: 'local-3',
        checksum: 'checksum-3',
        createdAt: afterCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-3', checksum: 'checksum-3', ownerId: userId);

      // Asset 4: Should NOT be included - different owner
      await insertLocalAsset(
        id: 'local-4',
        checksum: 'checksum-4',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-4', checksum: 'checksum-4', ownerId: otherUserId);

      // Asset 5: Should NOT be included - remote asset is deleted
      await insertLocalAsset(
        id: 'local-5',
        checksum: 'checksum-5',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-5', checksum: 'checksum-5', ownerId: userId, deletedAt: now);

      // Asset 6: Should NOT be included - is favorite (when keepFavorites=true)
      await insertLocalAsset(
        id: 'local-6',
        checksum: 'checksum-6',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: true,
      );
      await insertRemoteAsset(id: 'remote-6', checksum: 'checksum-6', ownerId: userId);

      final result = await repository.getRemovalCandidates(userId, cutoffDate, keepFavorites: true);

      expect(result.assets.length, 1);
      expect(result.assets[0].id, 'local-1');
    });

    test('includes favorites when keepFavorites is false', () async {
      await insertLocalAsset(
        id: 'local-favorite',
        checksum: 'checksum-fav',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: true,
      );
      await insertRemoteAsset(id: 'remote-favorite', checksum: 'checksum-fav', ownerId: userId);

      final result = await repository.getRemovalCandidates(userId, cutoffDate, keepFavorites: false);

      expect(result.assets.length, 1);
      expect(result.assets[0].id, 'local-favorite');
      expect(result.assets[0].isFavorite, true);
    });

    test('keepMediaType photosOnly returns only videos for deletion', () async {
      // Photo - should be kept
      await insertLocalAsset(
        id: 'local-photo',
        checksum: 'checksum-photo',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-photo', checksum: 'checksum-photo', ownerId: userId);

      // Video - should be deleted
      await insertLocalAsset(
        id: 'local-video',
        checksum: 'checksum-video',
        createdAt: beforeCutoff,
        type: AssetType.video,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-video', checksum: 'checksum-video', ownerId: userId);

      final result = await repository.getRemovalCandidates(userId, cutoffDate, keepMediaType: AssetKeepType.photosOnly);

      expect(result.assets.length, 1);
      expect(result.assets[0].id, 'local-video');
      expect(result.assets[0].type, AssetType.video);
    });

    test('keepMediaType videosOnly returns only photos for deletion', () async {
      // Photo - should be deleted
      await insertLocalAsset(
        id: 'local-photo',
        checksum: 'checksum-photo',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-photo', checksum: 'checksum-photo', ownerId: userId);

      // Video - should be kept
      await insertLocalAsset(
        id: 'local-video',
        checksum: 'checksum-video',
        createdAt: beforeCutoff,
        type: AssetType.video,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-video', checksum: 'checksum-video', ownerId: userId);

      final result = await repository.getRemovalCandidates(userId, cutoffDate, keepMediaType: AssetKeepType.videosOnly);

      expect(result.assets.length, 1);
      expect(result.assets[0].id, 'local-photo');
      expect(result.assets[0].type, AssetType.image);
    });

    test('returns both photos and videos with keepMediaType.all', () async {
      // Photo
      await insertLocalAsset(
        id: 'local-photo',
        checksum: 'checksum-photo',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-photo', checksum: 'checksum-photo', ownerId: userId);

      // Video
      await insertLocalAsset(
        id: 'local-video',
        checksum: 'checksum-video',
        createdAt: beforeCutoff,
        type: AssetType.video,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-video', checksum: 'checksum-video', ownerId: userId);

      final result = await repository.getRemovalCandidates(userId, cutoffDate, keepMediaType: AssetKeepType.none);

      expect(result.assets.length, 2);
      final ids = result.assets.map((a) => a.id).toSet();
      expect(ids, containsAll(['local-photo', 'local-video']));
    });

    test('excludes assets in iOS shared albums', () async {
      // Regular album
      await insertLocalAlbum(id: 'album-regular', name: 'Regular Album', isIosSharedAlbum: false);

      // iOS shared album
      await insertLocalAlbum(id: 'album-shared', name: 'Shared Album', isIosSharedAlbum: true);

      // Asset in regular album (should be included)
      await insertLocalAsset(
        id: 'local-regular',
        checksum: 'checksum-regular',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-regular', checksum: 'checksum-regular', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-regular', assetId: 'local-regular');

      // Asset in iOS shared album (should be excluded)
      await insertLocalAsset(
        id: 'local-shared',
        checksum: 'checksum-shared',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-shared', checksum: 'checksum-shared', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-shared', assetId: 'local-shared');

      final result = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(result.assets.length, 1);
      expect(result.assets[0].id, 'local-regular');
    });

    test('includes assets at exact cutoff date', () async {
      await insertLocalAsset(
        id: 'local-exact',
        checksum: 'checksum-exact',
        createdAt: cutoffDate,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-exact', checksum: 'checksum-exact', ownerId: userId);

      final result = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(result.assets.length, 1);
      expect(result.assets[0].id, 'local-exact');
    });

    test('returns empty list when no assets match criteria', () async {
      // Only assets after cutoff
      await insertLocalAsset(
        id: 'local-after',
        checksum: 'checksum-after',
        createdAt: afterCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-after', checksum: 'checksum-after', ownerId: userId);

      final result = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(result.assets, isEmpty);
    });

    test('handles multiple assets with same checksum', () async {
      // Two local assets with same checksum (edge case, but should handle it)
      await insertLocalAsset(
        id: 'local-dup1',
        checksum: 'checksum-dup',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertLocalAsset(
        id: 'local-dup2',
        checksum: 'checksum-dup',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-dup', checksum: 'checksum-dup', ownerId: userId);

      final result = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(result.assets.length, 2);
      expect(result.assets.map((a) => a.checksum).toSet(), equals({'checksum-dup'}));
    });

    test('includes assets not in any album', () async {
      // Asset not in any album should be included
      await insertLocalAsset(
        id: 'local-no-album',
        checksum: 'checksum-no-album',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-no-album', checksum: 'checksum-no-album', ownerId: userId);

      final result = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(result.assets.length, 1);
      expect(result.assets[0].id, 'local-no-album');
    });

    test('excludes asset that is in both regular and iOS shared album', () async {
      // Regular album
      await insertLocalAlbum(id: 'album-regular', name: 'Regular Album', isIosSharedAlbum: false);

      // iOS shared album
      await insertLocalAlbum(id: 'album-shared', name: 'Shared Album', isIosSharedAlbum: true);

      // Asset in BOTH albums - should be excluded because it's in an iOS shared album
      await insertLocalAsset(
        id: 'local-both',
        checksum: 'checksum-both',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-both', checksum: 'checksum-both', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-regular', assetId: 'local-both');
      await insertLocalAlbumAsset(albumId: 'album-shared', assetId: 'local-both');

      final result = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(result.assets, isEmpty);
    });

    test('excludes assets with null checksum (not backed up)', () async {
      // Asset with null checksum cannot be matched to remote asset
      await db
          .into(db.localAssetEntity)
          .insert(
            LocalAssetEntityCompanion.insert(
              id: 'local-null-checksum',
              name: 'asset_null.jpg',
              checksum: const Value.absent(), // null checksum
              type: AssetType.image,
              createdAt: Value(beforeCutoff),
              updatedAt: Value(beforeCutoff),
              isFavorite: const Value(false),
            ),
          );

      final result = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(result.assets, isEmpty);
    });

    test('excludes assets in user-excluded albums', () async {
      // Create two regular albums
      await insertLocalAlbum(id: 'album-include', name: 'Include Album', isIosSharedAlbum: false);
      await insertLocalAlbum(id: 'album-exclude', name: 'Exclude Album', isIosSharedAlbum: false);

      // Asset in included album - should be included
      await insertLocalAsset(
        id: 'local-in-included',
        checksum: 'checksum-included',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-included', checksum: 'checksum-included', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-include', assetId: 'local-in-included');

      // Asset in excluded album - should NOT be included
      await insertLocalAsset(
        id: 'local-in-excluded',
        checksum: 'checksum-excluded',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-excluded', checksum: 'checksum-excluded', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-exclude', assetId: 'local-in-excluded');

      final result = await repository.getRemovalCandidates(userId, cutoffDate, keepAlbumIds: {'album-exclude'});

      expect(result.assets.length, 1);
      expect(result.assets[0].id, 'local-in-included');
    });

    test('excludes assets that are in any of multiple excluded albums', () async {
      // Create multiple albums
      await insertLocalAlbum(id: 'album-1', name: 'Album 1', isIosSharedAlbum: false);
      await insertLocalAlbum(id: 'album-2', name: 'Album 2', isIosSharedAlbum: false);
      await insertLocalAlbum(id: 'album-3', name: 'Album 3', isIosSharedAlbum: false);

      // Asset in album-1 (excluded) - should NOT be included
      await insertLocalAsset(
        id: 'local-1',
        checksum: 'checksum-1',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-1', checksum: 'checksum-1', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-1', assetId: 'local-1');

      // Asset in album-2 (excluded) - should NOT be included
      await insertLocalAsset(
        id: 'local-2',
        checksum: 'checksum-2',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-2', checksum: 'checksum-2', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-2', assetId: 'local-2');

      // Asset in album-3 (not excluded) - should be included
      await insertLocalAsset(
        id: 'local-3',
        checksum: 'checksum-3',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-3', checksum: 'checksum-3', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-3', assetId: 'local-3');

      final result = await repository.getRemovalCandidates(userId, cutoffDate, keepAlbumIds: {'album-1', 'album-2'});

      expect(result.assets.length, 1);
      expect(result.assets[0].id, 'local-3');
    });

    test('excludes asset that is in both excluded and non-excluded album', () async {
      await insertLocalAlbum(id: 'album-included', name: 'Included Album', isIosSharedAlbum: false);
      await insertLocalAlbum(id: 'album-excluded', name: 'Excluded Album', isIosSharedAlbum: false);

      // Asset in BOTH albums - should be excluded because it's in an excluded album
      await insertLocalAsset(
        id: 'local-both',
        checksum: 'checksum-both',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-both', checksum: 'checksum-both', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-included', assetId: 'local-both');
      await insertLocalAlbumAsset(albumId: 'album-excluded', assetId: 'local-both');

      final result = await repository.getRemovalCandidates(userId, cutoffDate, keepAlbumIds: {'album-excluded'});

      expect(result.assets, isEmpty);
    });

    test('includes all assets when excludedAlbumIds is empty', () async {
      await insertLocalAlbum(id: 'album-1', name: 'Album 1', isIosSharedAlbum: false);

      await insertLocalAsset(
        id: 'local-1',
        checksum: 'checksum-1',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-1', checksum: 'checksum-1', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-1', assetId: 'local-1');

      await insertLocalAsset(
        id: 'local-2',
        checksum: 'checksum-2',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-2', checksum: 'checksum-2', ownerId: userId);

      // Empty excludedAlbumIds should include all eligible assets
      final result = await repository.getRemovalCandidates(userId, cutoffDate, keepAlbumIds: {});

      expect(result.assets.length, 2);
    });

    test('excludes asset not in any album when album is excluded', () async {
      await insertLocalAlbum(id: 'album-excluded', name: 'Excluded Album', isIosSharedAlbum: false);

      // Asset NOT in any album - should be included
      await insertLocalAsset(
        id: 'local-no-album',
        checksum: 'checksum-no-album',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-no-album', checksum: 'checksum-no-album', ownerId: userId);

      // Asset in excluded album - should NOT be included
      await insertLocalAsset(
        id: 'local-in-excluded',
        checksum: 'checksum-in-excluded',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-in-excluded', checksum: 'checksum-in-excluded', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-excluded', assetId: 'local-in-excluded');

      final result = await repository.getRemovalCandidates(userId, cutoffDate, keepAlbumIds: {'album-excluded'});

      expect(result.assets.length, 1);
      expect(result.assets[0].id, 'local-no-album');
    });

    test('combines excludedAlbumIds with keepMediaType correctly', () async {
      await insertLocalAlbum(id: 'album-excluded', name: 'Excluded Album', isIosSharedAlbum: false);
      await insertLocalAlbum(id: 'album-regular', name: 'Regular Album', isIosSharedAlbum: false);

      // Photo in excluded album - should NOT be included (album excluded)
      await insertLocalAsset(
        id: 'local-photo-excluded',
        checksum: 'checksum-photo-excluded',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-photo-excluded', checksum: 'checksum-photo-excluded', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-excluded', assetId: 'local-photo-excluded');

      // Video in regular album - should be included (keepMediaType photosOnly = delete videos)
      await insertLocalAsset(
        id: 'local-video',
        checksum: 'checksum-video',
        createdAt: beforeCutoff,
        type: AssetType.video,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-video', checksum: 'checksum-video', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-regular', assetId: 'local-video');

      // Photo in regular album - should NOT be included (keepMediaType photosOnly = keep photos)
      await insertLocalAsset(
        id: 'local-photo-regular',
        checksum: 'checksum-photo-regular',
        createdAt: beforeCutoff,
        type: AssetType.image,
        isFavorite: false,
      );
      await insertRemoteAsset(id: 'remote-photo-regular', checksum: 'checksum-photo-regular', ownerId: userId);
      await insertLocalAlbumAsset(albumId: 'album-regular', assetId: 'local-photo-regular');

      final result = await repository.getRemovalCandidates(
        userId,
        cutoffDate,
        keepMediaType: AssetKeepType.photosOnly,
        keepAlbumIds: {'album-excluded'},
      );

      expect(result.assets.length, 1);
      expect(result.assets[0].id, 'local-video');
    });
  });

  group('reconcileHashesFromCloudId', () {
    final userId = 'user-123';
    final createdAt = DateTime(2024, 1, 10);
    final adjustmentTime = DateTime(2024, 1, 11);
    const latitude = 37.7749;
    const longitude = -122.4194;

    setUp(() async {
      await insertUser(userId, 'user@test.com');
    });

    test('updates local asset checksum when all metadata matches', () async {
      await insertLocalAsset(
        id: 'local-1',
        checksum: null,
        iCloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await insertRemoteAsset(id: 'remote-1', checksum: 'hash-abc123', ownerId: userId);

      await insertRemoteAssetCloudId(
        assetId: 'remote-1',
        cloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await repository.reconcileHashesFromCloudId();

      final updated = await repository.getById('local-1');
      expect(updated?.checksum, 'hash-abc123');
    });

    test('does not update when local asset already has checksum', () async {
      await insertLocalAsset(
        id: 'local-1',
        checksum: 'existing-checksum',
        iCloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await insertRemoteAsset(id: 'remote-1', checksum: 'hash-abc123', ownerId: userId);

      await insertRemoteAssetCloudId(
        assetId: 'remote-1',
        cloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await repository.reconcileHashesFromCloudId();

      final updated = await repository.getById('local-1');
      expect(updated?.checksum, 'existing-checksum');
    });

    test('does not update when adjustment_time does not match', () async {
      await insertLocalAsset(
        id: 'local-1',
        checksum: null,
        iCloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await insertRemoteAsset(id: 'remote-1', checksum: 'hash-abc123', ownerId: userId);

      await insertRemoteAssetCloudId(
        assetId: 'remote-1',
        cloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: DateTime(2024, 1, 12),
        latitude: latitude,
        longitude: longitude,
      );

      await repository.reconcileHashesFromCloudId();

      final updated = await repository.getById('local-1');
      expect(updated?.checksum, isNull);
    });

    test('does not update when latitude does not match', () async {
      await insertLocalAsset(
        id: 'local-1',
        checksum: null,
        iCloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await insertRemoteAsset(id: 'remote-1', checksum: 'hash-abc123', ownerId: userId);

      await insertRemoteAssetCloudId(
        assetId: 'remote-1',
        cloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: 40.7128,
        longitude: longitude,
      );

      await repository.reconcileHashesFromCloudId();

      final updated = await repository.getById('local-1');
      expect(updated?.checksum, isNull);
    });

    test('does not update when longitude does not match', () async {
      await insertLocalAsset(
        id: 'local-1',
        checksum: null,
        iCloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await insertRemoteAsset(id: 'remote-1', checksum: 'hash-abc123', ownerId: userId);

      await insertRemoteAssetCloudId(
        assetId: 'remote-1',
        cloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: -74.0060,
      );

      await repository.reconcileHashesFromCloudId();

      final updated = await repository.getById('local-1');
      expect(updated?.checksum, isNull);
    });

    test('does not update when createdAt does not match', () async {
      await insertLocalAsset(
        id: 'local-1',
        checksum: null,
        iCloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await insertRemoteAsset(id: 'remote-1', checksum: 'hash-abc123', ownerId: userId);

      await insertRemoteAssetCloudId(
        assetId: 'remote-1',
        cloudId: 'cloud-123',
        createdAt: DateTime(2024, 1, 5),
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await repository.reconcileHashesFromCloudId();

      final updated = await repository.getById('local-1');
      expect(updated?.checksum, isNull);
    });

    test('does not update when iCloudId is null', () async {
      await insertLocalAsset(
        id: 'local-1',
        checksum: null,
        iCloudId: null,
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await insertRemoteAsset(id: 'remote-1', checksum: 'hash-abc123', ownerId: userId);

      await insertRemoteAssetCloudId(
        assetId: 'remote-1',
        cloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await repository.reconcileHashesFromCloudId();

      final updated = await repository.getById('local-1');
      expect(updated?.checksum, isNull);
    });

    test('does not update when cloudId does not match iCloudId', () async {
      await insertLocalAsset(
        id: 'local-1',
        checksum: null,
        iCloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await insertRemoteAsset(id: 'remote-1', checksum: 'hash-abc123', ownerId: userId);

      await insertRemoteAssetCloudId(
        assetId: 'remote-1',
        cloudId: 'cloud-456',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await repository.reconcileHashesFromCloudId();

      final updated = await repository.getById('local-1');
      expect(updated?.checksum, isNull);
    });

    test('handles partial null metadata fields matching correctly', () async {
      await insertLocalAsset(
        id: 'local-1',
        checksum: null,
        iCloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: null,
        latitude: latitude,
        longitude: longitude,
      );

      await insertRemoteAsset(id: 'remote-1', checksum: 'hash-abc123', ownerId: userId);

      await insertRemoteAssetCloudId(
        assetId: 'remote-1',
        cloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: null,
        latitude: latitude,
        longitude: longitude,
      );

      await repository.reconcileHashesFromCloudId();

      final updated = await repository.getById('local-1');
      expect(updated?.checksum, 'hash-abc123');
    });

    test('does not update when one has null and other has value', () async {
      await insertLocalAsset(
        id: 'local-1',
        checksum: null,
        iCloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: null,
        longitude: longitude,
      );

      await insertRemoteAsset(id: 'remote-1', checksum: 'hash-abc123', ownerId: userId);

      await insertRemoteAssetCloudId(
        assetId: 'remote-1',
        cloudId: 'cloud-123',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await repository.reconcileHashesFromCloudId();

      final updated = await repository.getById('local-1');
      expect(updated?.checksum, isNull);
    });

    test('handles no matching assets gracefully', () async {
      await insertLocalAsset(
        id: 'local-1',
        checksum: null,
        iCloudId: 'cloud-999',
        createdAt: createdAt,
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      );

      await repository.reconcileHashesFromCloudId();

      final updated = await repository.getById('local-1');
      expect(updated?.checksum, isNull);
    });
  });
}

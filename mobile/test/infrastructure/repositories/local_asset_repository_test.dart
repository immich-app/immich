import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';

void main() {
  late Drift db;
  late DriftLocalAssetRepository repository;

  setUp(() {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    repository = DriftLocalAssetRepository(db);
  });

  tearDown(() async {
    await db.close();
  });

  group('getRemovalCandidates', () {
    final userId = 'user-123';
    final otherUserId = 'user-456';
    final now = DateTime(2024, 1, 15);
    final cutoffDate = DateTime(2024, 1, 10);
    final beforeCutoff = DateTime(2024, 1, 5);
    final afterCutoff = DateTime(2024, 1, 12);

    Future<void> insertUser(String id, String email) async {
      await db.into(db.userEntity).insert(UserEntityCompanion.insert(id: id, email: email, name: email));
    }

    setUp(() async {
      await insertUser(userId, 'user@test.com');
      await insertUser(otherUserId, 'other@test.com');
    });

    Future<void> insertLocalAsset({
      required String id,
      required String checksum,
      required DateTime createdAt,
      required AssetType type,
      required bool isFavorite,
    }) async {
      await db
          .into(db.localAssetEntity)
          .insert(
            LocalAssetEntityCompanion.insert(
              id: id,
              name: 'asset_$id.jpg',
              checksum: Value(checksum),
              type: type,
              createdAt: Value(createdAt),
              updatedAt: Value(createdAt),
              isFavorite: Value(isFavorite),
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

      final candidates = await repository.getRemovalCandidates(userId, cutoffDate, keepFavorites: true);

      expect(candidates.length, 1);
      expect(candidates[0].id, 'local-1');
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

      final candidates = await repository.getRemovalCandidates(userId, cutoffDate, keepFavorites: false);

      expect(candidates.length, 1);
      expect(candidates[0].id, 'local-favorite');
      expect(candidates[0].isFavorite, true);
    });

    test('filters by photos only', () async {
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

      final candidates = await repository.getRemovalCandidates(
        userId,
        cutoffDate,
        filterType: AssetFilterType.photosOnly,
      );

      expect(candidates.length, 1);
      expect(candidates[0].id, 'local-photo');
      expect(candidates[0].type, AssetType.image);
    });

    test('filters by videos only', () async {
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

      final candidates = await repository.getRemovalCandidates(
        userId,
        cutoffDate,
        filterType: AssetFilterType.videosOnly,
      );

      expect(candidates.length, 1);
      expect(candidates[0].id, 'local-video');
      expect(candidates[0].type, AssetType.video);
    });

    test('returns both photos and videos with filterType.all', () async {
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

      final candidates = await repository.getRemovalCandidates(userId, cutoffDate, filterType: AssetFilterType.all);

      expect(candidates.length, 2);
      final ids = candidates.map((a) => a.id).toSet();
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

      final candidates = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(candidates.length, 1);
      expect(candidates[0].id, 'local-regular');
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

      final candidates = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(candidates.length, 1);
      expect(candidates[0].id, 'local-exact');
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

      final candidates = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(candidates, isEmpty);
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

      final candidates = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(candidates.length, 2);
      expect(candidates.map((a) => a.checksum).toSet(), equals({'checksum-dup'}));
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

      final candidates = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(candidates.length, 1);
      expect(candidates[0].id, 'local-no-album');
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

      final candidates = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(candidates, isEmpty);
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

      final candidates = await repository.getRemovalCandidates(userId, cutoffDate);

      expect(candidates, isEmpty);
    });
  });
}

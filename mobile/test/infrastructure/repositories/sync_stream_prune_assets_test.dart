import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:openapi/api.dart';

/// This test reproduces the bug where pruneAssets() deletes assets that are part of memories,
/// causing foreign key constraint failures when trying to insert memory-asset relationships.
void main() {
  late DbRepository db;
  late SyncStreamRepository sut;

  setUp(() async {
    db = DbRepository(NativeDatabase.memory());
    sut = SyncStreamRepository(db);

    // Set up test data: Create a user and a partner
    await sut.updateAuthUsersV1([
      SyncAuthUserV1(
        email: 'current-user@test.com',
        id: 'user-1',
        isAdmin: false,
        name: 'Current User',
        avatarColor: null,
        hasProfileImage: false,
        profileChangedAt: DateTime(2025),
      ),
    ]);

    await sut.updateUsersV1([
      SyncUserV1(
        deletedAt: null,
        email: 'partner@test.com',
        id: 'partner-1',
        name: 'Partner User',
        avatarColor: null,
        hasProfileImage: false,
        profileChangedAt: DateTime(2025),
      ),
    ]);

    await sut.updatePartnerV1([
      SyncPartnerV1(
        inTimeline: true,
        sharedById: 'partner-1',
        sharedWithId: 'user-1',
      ),
    ]);
  });

  tearDown(() async {
    await db.close();
  });

  group('pruneAssets - Memory Asset Bug', () {
    test('BEFORE FIX: pruneAssets() should NOT delete assets that are part of memories', () async {
      // Step 1: Create an asset owned by someone else (not current user or partner)
      await sut.updateAssetsV1([
        SyncAssetV1(
          checksum: 'checksum-1'.codeUnits,
          deletedAt: null,
          deviceAssetId: 'device-1',
          deviceId: 'device-1',
          duplicateId: null,
          duration: null,
          fileCreatedAt: DateTime(2025, 1, 1),
          fileModifiedAt: DateTime(2025, 1, 1),
          id: 'asset-shared-memory',
          isArchived: false,
          isFavorite: false,
          isOffline: false,
          isTrashed: false,
          libraryId: null,
          livePhotoVideoId: null,
          localDateTime: DateTime(2025, 1, 1),
          originalFileName: 'shared-memory.jpg',
          // Asset owned by someone else - should be pruned if not in album/memory
          ownerId: 'other-user-not-partner',
          resized: true,
          stackId: null,
          thumbhash: null,
          type: AssetTypeEnum.IMAGE,
          updatedAt: DateTime(2025, 1, 1),
          visibility: AssetVisibility.public_,
        ),
      ]);

      // Step 2: Create a memory owned by current user
      await sut.updateMemoriesV1([
        SyncMemoryV1(
          createdAt: DateTime(2025, 1, 1),
          data: {'year': 2025, 'title': 'Test Memory'},
          deletedAt: null,
          hideAt: null,
          id: 'memory-1',
          isSaved: false,
          memoryAt: DateTime(2025, 1, 1),
          ownerId: 'user-1',
          seenAt: null,
          showAt: DateTime(2025, 1, 1),
          type: MemoryType.onThisDay,
          updatedAt: DateTime(2025, 1, 1),
        ),
      ]);

      // Step 3: Link the shared asset to the memory
      await sut.updateMemoryAssetsV1([
        SyncMemoryAssetV1(
          assetId: 'asset-shared-memory',
          memoryId: 'memory-1',
        ),
      ]);

      // Verify the asset and memory-asset relationship exist
      final assetsBefore = await db.remoteAssetEntity.select().get();
      final memoryAssetsBefore = await db.memoryAssetEntity.select().get();
      expect(assetsBefore.length, 1);
      expect(assetsBefore.first.id, 'asset-shared-memory');
      expect(memoryAssetsBefore.length, 1);

      // Step 4: Call pruneAssets() - This is where the bug happens
      await sut.pruneAssets();

      // Step 5: Verify the asset is NOT deleted (because it's in a memory)
      final assetsAfter = await db.remoteAssetEntity.select().get();
      expect(
        assetsAfter.length,
        1,
        reason: 'Asset should NOT be pruned because it is part of a memory',
      );
      expect(assetsAfter.first.id, 'asset-shared-memory');

      // Step 6: Verify we can still work with memory-asset relationships
      // This simulates receiving more sync events after pruning
      await expectLater(
        sut.updateMemoryAssetsV1([
          SyncMemoryAssetV1(
            assetId: 'asset-shared-memory',
            memoryId: 'memory-1',
          ),
        ]),
        completes,
        reason: 'Should not throw foreign key constraint error',
      );
    });

    test('pruneAssets() SHOULD delete assets not in albums or memories', () async {
      // Step 1: Create an asset that's truly orphaned (not in album or memory)
      await sut.updateAssetsV1([
        SyncAssetV1(
          checksum: 'checksum-2'.codeUnits,
          deletedAt: null,
          deviceAssetId: 'device-2',
          deviceId: 'device-2',
          duplicateId: null,
          duration: null,
          fileCreatedAt: DateTime(2025, 1, 1),
          fileModifiedAt: DateTime(2025, 1, 1),
          id: 'asset-orphaned',
          isArchived: false,
          isFavorite: false,
          isOffline: false,
          isTrashed: false,
          libraryId: null,
          livePhotoVideoId: null,
          localDateTime: DateTime(2025, 1, 1),
          originalFileName: 'orphaned.jpg',
          ownerId: 'other-user-not-partner',
          resized: true,
          stackId: null,
          thumbhash: null,
          type: AssetTypeEnum.IMAGE,
          updatedAt: DateTime(2025, 1, 1),
          visibility: AssetVisibility.public_,
        ),
      ]);

      // Verify the asset exists
      final assetsBefore = await db.remoteAssetEntity.select().get();
      expect(assetsBefore.length, 1);

      // Call pruneAssets()
      await sut.pruneAssets();

      // Verify the orphaned asset IS deleted
      final assetsAfter = await db.remoteAssetEntity.select().get();
      expect(
        assetsAfter.length,
        0,
        reason: 'Orphaned asset should be pruned',
      );
    });

    test('pruneAssets() should NOT delete assets in albums', () async {
      // Step 1: Create an asset and an album
      await sut.updateAssetsV1([
        SyncAssetV1(
          checksum: 'checksum-3'.codeUnits,
          deletedAt: null,
          deviceAssetId: 'device-3',
          deviceId: 'device-3',
          duplicateId: null,
          duration: null,
          fileCreatedAt: DateTime(2025, 1, 1),
          fileModifiedAt: DateTime(2025, 1, 1),
          id: 'asset-in-album',
          isArchived: false,
          isFavorite: false,
          isOffline: false,
          isTrashed: false,
          libraryId: null,
          livePhotoVideoId: null,
          localDateTime: DateTime(2025, 1, 1),
          originalFileName: 'in-album.jpg',
          ownerId: 'other-user-not-partner',
          resized: true,
          stackId: null,
          thumbhash: null,
          type: AssetTypeEnum.IMAGE,
          updatedAt: DateTime(2025, 1, 1),
          visibility: AssetVisibility.public_,
        ),
      ]);

      await sut.updateAlbumsV1([
        SyncAlbumV1(
          albumName: 'Test Album',
          albumThumbnailAssetId: null,
          createdAt: DateTime(2025, 1, 1),
          deletedAt: null,
          description: 'Test',
          id: 'album-1',
          isActivityEnabled: false,
          lastModifiedAssetTimestamp: DateTime(2025, 1, 1),
          order: AlbumUserRole.editor,
          ownerId: 'user-1',
          startDate: DateTime(2025, 1, 1),
          endDate: DateTime(2025, 1, 2),
          updatedAt: DateTime(2025, 1, 1),
        ),
      ]);

      await sut.updateAlbumToAssetsV1([
        SyncAlbumToAssetV1(
          albumId: 'album-1',
          assetId: 'asset-in-album',
        ),
      ]);

      // Verify setup
      final assetsBefore = await db.remoteAssetEntity.select().get();
      expect(assetsBefore.length, 1);

      // Call pruneAssets()
      await sut.pruneAssets();

      // Verify asset is NOT deleted (protected by album membership)
      final assetsAfter = await db.remoteAssetEntity.select().get();
      expect(
        assetsAfter.length,
        1,
        reason: 'Asset should NOT be pruned because it is in an album',
      );
    });
  });
}

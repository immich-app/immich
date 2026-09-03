import 'package:drift/drift.dart' show Value;
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/server_deleted_checksum.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late TrashSyncRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = TrashSyncRepository(ctx.db);
  });

  tearDown(() => ctx.dispose());

  Future<({String localId, String checksum, String remoteId})> backedUpAsset({
    required String ownerId,
    DateTime? remoteDeletedAt,
    BackupSelection album = .selected,
  }) async {
    final remote = await ctx.newRemoteAsset(ownerId: ownerId, deletedAt: remoteDeletedAt);
    final local = await ctx.newLocalAsset(checksum: remote.checksum);
    final localAlbum = await ctx.newLocalAlbum(backupSelection: album);
    await ctx.newLocalAlbumAsset(albumId: localAlbum.id, assetId: local.id);
    return (localId: local.id, checksum: remote.checksum, remoteId: remote.id);
  }

  Future<TrashSyncStatus?> trashStatusOf(String assetId) async {
    final rows = await ctx.db.select(ctx.db.trashSyncEntity).get();
    return rows.where((r) => r.assetId == assetId).map((r) => r.status).firstOrNull;
  }

  Future<void> markAsset({
    required String assetId,
    required String checksum,
    required TrashSyncStatus status,
    DateTime? assetUpdatedAt,
  }) => ctx.db
      .into(ctx.db.trashSyncEntity)
      .insert(
        TrashSyncEntityCompanion.insert(
          assetId: assetId,
          checksum: checksum,
          status: Value(status),
          assetUpdatedAt: Value.absentIfNull(assetUpdatedAt),
        ),
      );

  Future<String?> checksumOf(String assetId) async {
    final rows = await ctx.db.select(ctx.db.localAssetEntity).get();
    return rows.where((r) => r.id == assetId).map((r) => r.checksum).firstOrNull;
  }

  late String userId;
  setUp(() async {
    userId = (await ctx.newUser()).id;
    await ctx.newAuthUser(id: userId);
  });

  group('recordSoftDeletedAssets', () {
    test('records marker when server asset is trashed', () async {
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: .new(2026, 1, 1));

      await sut.recordSoftDeletedAssets();

      expect(await sut.getPendingAssetIds(), [asset.localId]);
    });

    test('#24124: asset on server is never trashed', () async {
      await backedUpAsset(ownerId: userId, remoteDeletedAt: null);

      await sut.recordSoftDeletedAssets();

      expect(await sut.getPendingAssetIds(), isEmpty);
    });

    test('ignores assets that are not in a backup selected album', () async {
      await backedUpAsset(ownerId: userId, remoteDeletedAt: .new(2026, 1, 1), album: .none);

      await sut.recordSoftDeletedAssets();

      expect(await sut.getPendingAssetIds(), isEmpty);
    });

    test('existing marker is not duplicated', () async {
      await backedUpAsset(ownerId: userId, remoteDeletedAt: .new(2026, 1, 1));

      await sut.recordSoftDeletedAssets();
      await sut.recordSoftDeletedAssets();

      expect(await sut.getPendingAssetIds(), hasLength(1));
    });

    test('#24124: does not retrash a dismissed / restored asset', () async {
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: .new(2026, 1, 1));
      await markAsset(assetId: asset.localId, checksum: asset.checksum, status: .dismissed);

      await sut.recordSoftDeletedAssets();

      expect(await sut.getPendingAssetIds(), isEmpty);
      expect(await trashStatusOf(asset.localId), TrashSyncStatus.dismissed);
    });
  });

  group('review markers', () {
    test('records soft-deleted assets as review pending in review mode without MANAGE_MEDIA', () async {
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));

      await sut.recordSoftDeletedReviewAssets();

      final rows = await ctx.db.select(ctx.db.trashSyncEntity).get();
      expect(rows.single.assetId, asset.localId);
      expect(rows.single.checksum, asset.checksum);
      expect(rows.single.status, TrashSyncStatus.pending);
    });

    test('records hard-deleted assets as review pending from server_deleted_checksum', () async {
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: null);
      await sut.recordHardDeletedChecksums([asset.remoteId]);
      await (ctx.db.delete(ctx.db.remoteAssetEntity)..where((t) => t.id.equals(asset.remoteId))).go();

      await sut.recordHardDeletedReviewAssets();

      final rows = await ctx.db.select(ctx.db.trashSyncEntity).get();
      expect(rows.single.assetId, asset.localId);
      expect(rows.single.checksum, asset.checksum);
      expect(rows.single.status, TrashSyncStatus.pending);
    });

    test('rejected local asset suppresses its hard-deleted review candidate until remote restore', () async {
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      await sut.recordSoftDeletedReviewAssets();
      await sut.markReviewAssetsRejected([asset.localId]);
      await sut.recordHardDeletedChecksums([asset.remoteId]);
      await (ctx.db.delete(ctx.db.remoteAssetEntity)..where((t) => t.id.equals(asset.remoteId))).go();

      await sut.recordHardDeletedReviewAssets();

      expect(await trashStatusOf(asset.localId), TrashSyncStatus.reviewRejected);
    });

    test('updates a pending review marker with a newer remote deletion time', () async {
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      final newerDeletedAt = DateTime(2026, 2, 1);

      await sut.recordSoftDeletedReviewAssets();
      await (ctx.db.update(
        ctx.db.remoteAssetEntity,
      )..where((t) => t.id.equals(asset.remoteId))).write(RemoteAssetEntityCompanion(deletedAt: Value(newerDeletedAt)));
      await sut.recordSoftDeletedReviewAssets();

      final rows = await ctx.db.select(ctx.db.trashSyncEntity).get();
      expect(rows.single.status, TrashSyncStatus.pending);
      expect(rows.single.remoteDeletedAt, newerDeletedAt.toUtc());
    });

    test('keeps a pending review marker when the remote deletion time is older', () async {
      final existingDeletedAt = DateTime(2026, 2, 1);
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: existingDeletedAt);

      await sut.recordSoftDeletedReviewAssets();
      await (ctx.db.update(ctx.db.remoteAssetEntity)..where((t) => t.id.equals(asset.remoteId))).write(
        RemoteAssetEntityCompanion(deletedAt: Value(DateTime(2026, 1, 1))),
      );
      await sut.recordSoftDeletedReviewAssets();

      final rows = await ctx.db.select(ctx.db.trashSyncEntity).get();
      expect(rows.single.status, TrashSyncStatus.pending);
      expect(rows.single.remoteDeletedAt, existingDeletedAt.toUtc());
    });

    test('keeps a pending review marker when the remote deletion time is equal', () async {
      final existingDeletedAt = DateTime(2026, 1, 1);
      final existingUpdatedAt = DateTime(2026, 1, 2);
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: existingDeletedAt);

      await sut.recordSoftDeletedReviewAssets();
      await (ctx.db.update(ctx.db.trashSyncEntity)..where((t) => t.assetId.equals(asset.localId))).write(
        TrashSyncEntityCompanion(assetUpdatedAt: Value(existingUpdatedAt)),
      );
      await sut.recordSoftDeletedReviewAssets();

      final rows = await ctx.db.select(ctx.db.trashSyncEntity).get();
      expect(rows.single.status, TrashSyncStatus.pending);
      expect(rows.single.remoteDeletedAt, existingDeletedAt.toUtc());
      expect(rows.single.assetUpdatedAt, existingUpdatedAt);
    });

    test('preserves remoteDeletedAt when a hard-delete pass matches an already pending review marker', () async {
      final existingDeletedAt = DateTime(2026, 1, 1);
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: existingDeletedAt);

      await sut.recordSoftDeletedReviewAssets();
      // Simulates the same checksum also being recorded as hard-deleted (e.g. reused content),
      // without the remote row being removed first, so the pending marker stays matchable by both passes.
      await sut.recordHardDeletedChecksums([asset.remoteId]);
      await sut.recordHardDeletedReviewAssets();

      final rows = await ctx.db.select(ctx.db.trashSyncEntity).get();
      expect(rows.single.status, TrashSyncStatus.pending);
      expect(rows.single.remoteDeletedAt, existingDeletedAt.toUtc());
    });

    test('rejecting an asset without a pending marker does not create a review decision', () async {
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));

      final rejected = await sut.markReviewAssetsRejected([asset.localId]);

      expect(rejected, 0);
      expect(await trashStatusOf(asset.localId), isNull);
    });
  });

  group('review status', () {
    test('watches the count of pending review markers for selected local assets', () async {
      await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      final unselected = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1), album: .none);
      await sut.recordSoftDeletedReviewAssets();
      await markAsset(assetId: unselected.localId, checksum: unselected.checksum, status: .pending);

      expect(await sut.watchPendingReviewCount().first, 1);
    });

    test('does not count an unselected marked copy through a selected duplicate checksum', () async {
      final marked = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      final selectedDuplicate = await backedUpAsset(
        ownerId: userId,
        remoteDeletedAt: DateTime(2026, 1, 1),
        album: .none,
      );
      await (ctx.db.update(ctx.db.localAssetEntity)..where((asset) => asset.id.equals(selectedDuplicate.localId)))
          .write(LocalAssetEntityCompanion(checksum: Value(marked.checksum)));
      await (ctx.db.update(ctx.db.localAlbumEntity)..where((album) => album.backupSelection.equalsValue(.selected)))
          .write(const LocalAlbumEntityCompanion(backupSelection: Value(BackupSelection.none)));
      final selectedAlbum = await ctx.newLocalAlbum(backupSelection: .selected);
      await ctx.newLocalAlbumAsset(albumId: selectedAlbum.id, assetId: selectedDuplicate.localId);
      await markAsset(assetId: marked.localId, checksum: marked.checksum, status: .pending);

      expect(await sut.watchPendingReviewCount().first, 0);
    });

    test('counts each pending selected local copy with the same checksum', () async {
      final marked = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      final selectedDuplicate = await backedUpAsset(
        ownerId: userId,
        remoteDeletedAt: DateTime(2026, 1, 1),
        album: .selected,
      );
      await (ctx.db.update(ctx.db.localAssetEntity)..where((asset) => asset.id.equals(selectedDuplicate.localId)))
          .write(LocalAssetEntityCompanion(checksum: Value(marked.checksum)));
      await markAsset(assetId: marked.localId, checksum: marked.checksum, status: .pending);
      await markAsset(assetId: selectedDuplicate.localId, checksum: marked.checksum, status: .pending);

      expect(await sut.watchPendingReviewCount().first, 2);
    });

    test('rejecting one local copy leaves another copy with the same checksum pending', () async {
      final first = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      final second = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      await (ctx.db.update(ctx.db.localAssetEntity)..where((asset) => asset.id.equals(second.localId))).write(
        LocalAssetEntityCompanion(checksum: Value(first.checksum)),
      );
      await sut.recordSoftDeletedReviewAssets();

      expect(await sut.markReviewAssetsRejected([first.localId]), 1);

      expect(await trashStatusOf(first.localId), TrashSyncStatus.reviewRejected);
      expect(await trashStatusOf(second.localId), TrashSyncStatus.pending);
      expect(await sut.getReviewableAssetIds([first.localId, second.localId]), [second.localId]);
    });

    test('does not resolve a selected duplicate through another copy marker', () async {
      final marked = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      final selectedDuplicate = await backedUpAsset(
        ownerId: userId,
        remoteDeletedAt: DateTime(2026, 1, 1),
        album: .none,
      );
      await (ctx.db.update(ctx.db.localAssetEntity)..where((asset) => asset.id.equals(selectedDuplicate.localId)))
          .write(LocalAssetEntityCompanion(checksum: Value(marked.checksum)));
      await (ctx.db.update(ctx.db.localAlbumEntity)..where((album) => album.backupSelection.equalsValue(.selected)))
          .write(const LocalAlbumEntityCompanion(backupSelection: Value(BackupSelection.none)));
      final selectedAlbum = await ctx.newLocalAlbum(backupSelection: .selected);
      await ctx.newLocalAlbumAsset(albumId: selectedAlbum.id, assetId: selectedDuplicate.localId);
      await markAsset(assetId: marked.localId, checksum: marked.checksum, status: .pending);

      expect(await sut.getReviewableAssetIds([selectedDuplicate.localId]), isEmpty);
      expect(await sut.markReviewAssetsRejected([selectedDuplicate.localId]), 0);
      expect(await trashStatusOf(marked.localId), TrashSyncStatus.pending);
    });

    test('returns only the number of actionable assets that were rejected', () async {
      final actionable = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      final withoutMarker = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      await markAsset(assetId: actionable.localId, checksum: actionable.checksum, status: .pending);

      final rejectedCount = await sut.markReviewAssetsRejected([
        actionable.localId,
        actionable.localId,
        withoutMarker.localId,
        'missing',
      ]);

      expect(rejectedCount, 1);
      expect(await trashStatusOf(actionable.localId), TrashSyncStatus.reviewRejected);
      expect(await trashStatusOf(withoutMarker.localId), isNull);
    });

    test('does not approve a selected duplicate through another copy marker', () async {
      final marked = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      final selectedDuplicate = await backedUpAsset(
        ownerId: userId,
        remoteDeletedAt: DateTime(2026, 1, 1),
        album: .none,
      );
      await (ctx.db.update(ctx.db.localAssetEntity)..where((asset) => asset.id.equals(selectedDuplicate.localId)))
          .write(LocalAssetEntityCompanion(checksum: Value(marked.checksum)));
      await (ctx.db.update(ctx.db.localAlbumEntity)..where((album) => album.backupSelection.equalsValue(.selected)))
          .write(const LocalAlbumEntityCompanion(backupSelection: Value(BackupSelection.none)));
      final selectedAlbum = await ctx.newLocalAlbum(backupSelection: .selected);
      await ctx.newLocalAlbumAsset(albumId: selectedAlbum.id, assetId: selectedDuplicate.localId);
      await markAsset(assetId: marked.localId, checksum: marked.checksum, status: .pending);

      await sut.markReviewAssetsApproved({selectedDuplicate.localId});
      await (ctx.db.delete(ctx.db.localAssetEntity)..where((asset) => asset.id.equals(selectedDuplicate.localId))).go();

      expect(await trashStatusOf(marked.localId), TrashSyncStatus.pending);
      expect(await trashStatusOf(selectedDuplicate.localId), isNull);
    });

    test('keeps an approved marker for every selected duplicate copy', () async {
      final first = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      final second = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      await (ctx.db.update(ctx.db.localAssetEntity)..where((asset) => asset.id.equals(second.localId))).write(
        LocalAssetEntityCompanion(checksum: Value(first.checksum)),
      );
      await sut.recordSoftDeletedReviewAssets();

      await sut.markReviewAssetsApproved({first.localId, second.localId});
      await (ctx.db.delete(
        ctx.db.localAssetEntity,
      )..where((asset) => asset.id.isIn([first.localId, second.localId]))).go();

      expect(await trashStatusOf(first.localId), TrashSyncStatus.reviewApproved);
      expect(await trashStatusOf(second.localId), TrashSyncStatus.reviewApproved);
    });

    test('does not carry the review deletion date into an approved marker', () async {
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      await sut.recordSoftDeletedReviewAssets();

      await sut.markReviewAssetsApproved({asset.localId});

      final marker = await (ctx.db.select(
        ctx.db.trashSyncEntity,
      )..where((row) => row.assetId.equals(asset.localId))).getSingle();
      expect(marker.status, TrashSyncStatus.reviewApproved);
      expect(marker.remoteDeletedAt, isNull);
    });

    test('restores the checksum after an approved review asset returns from trash', () async {
      final assetUpdatedAt = DateTime(2026, 1, 2);
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      await (ctx.db.update(ctx.db.localAssetEntity)..where((row) => row.id.equals(asset.localId))).write(
        LocalAssetEntityCompanion(updatedAt: Value(assetUpdatedAt)),
      );

      await sut.recordSoftDeletedReviewAssets();
      expect(await trashStatusOf(asset.localId), TrashSyncStatus.pending);

      await sut.markReviewAssetsApproved({asset.localId});
      await (ctx.db.delete(ctx.db.localAssetEntity)..where((row) => row.id.equals(asset.localId))).go();
      expect(await trashStatusOf(asset.localId), TrashSyncStatus.reviewApproved);

      await (ctx.db.update(
        ctx.db.remoteAssetEntity,
      )..where((row) => row.id.equals(asset.remoteId))).write(const RemoteAssetEntityCompanion(deletedAt: Value(null)));
      expect(await sut.getRestorableAssetIds(), [asset.localId]);

      await sut.markRestored({asset.localId});
      await ctx.newLocalAsset(id: asset.localId, checksumOption: const .none(), updatedAt: assetUpdatedAt);
      await sut.restoreChecksums();

      expect(await checksumOf(asset.localId), asset.checksum);
      expect(await trashStatusOf(asset.localId), isNull);
    });

    test('keeps failed duplicate pending while preserving each successful copy for restore', () async {
      final first = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      final second = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      await (ctx.db.update(ctx.db.localAssetEntity)..where((asset) => asset.id.equals(second.localId))).write(
        LocalAssetEntityCompanion(checksum: Value(first.checksum)),
      );
      await sut.recordSoftDeletedReviewAssets();

      await sut.markReviewAssetsApproved({first.localId});
      await (ctx.db.delete(ctx.db.localAssetEntity)..where((asset) => asset.id.equals(first.localId))).go();

      expect(await trashStatusOf(first.localId), TrashSyncStatus.reviewApproved);
      expect(await trashStatusOf(second.localId), TrashSyncStatus.pending);

      await sut.markReviewAssetsApproved({second.localId});
      await (ctx.db.delete(ctx.db.localAssetEntity)..where((asset) => asset.id.equals(second.localId))).go();

      expect(await trashStatusOf(first.localId), TrashSyncStatus.reviewApproved);
      expect(await trashStatusOf(second.localId), TrashSyncStatus.reviewApproved);
    });
  });

  group('getRestorableAssetIds', () {
    test('should mark asset restorable when asset is back on server', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: null);
      await markAsset(assetId: 'asset', checksum: remote.checksum, status: .trashed);

      expect(await sut.getRestorableAssetIds(), ['asset']);
    });

    test('pending assets are not restored', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: null);
      await markAsset(assetId: 'asset', checksum: remote.checksum, status: .pending);

      expect(await sut.getRestorableAssetIds(), isEmpty);
    });

    test('approved review assets are restorable after remote restore', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: null);
      await markAsset(assetId: 'asset', checksum: remote.checksum, status: .reviewApproved);

      await sut.pruneStaleMarkers();

      expect(await trashStatusOf('asset'), TrashSyncStatus.reviewApproved);
      expect(await sut.getRestorableAssetIds(), ['asset']);
    });

    test('do not mark asset restorable when server asset is still trashed', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: .new(2026, 1, 1));
      await markAsset(assetId: 'asset', checksum: remote.checksum, status: .trashed);

      expect(await sut.getRestorableAssetIds(), isEmpty);
    });

    test('do not mark asset restorable when server asset is permanently deleted', () async {
      await markAsset(assetId: 'asset', checksum: 'checksum', status: .trashed);

      expect(await sut.getRestorableAssetIds(), isEmpty);
    });
  });

  group('duplicate local copies of the same asset', () {
    test('recordSoftDeletedAssets records one marker per local copy', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: .new(2026, 1, 1));
      final album = await ctx.newLocalAlbum(backupSelection: .selected);
      final local1 = await ctx.newLocalAsset(checksum: remote.checksum);
      final local2 = await ctx.newLocalAsset(checksum: remote.checksum);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local1.id);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local2.id);

      await sut.recordSoftDeletedAssets();

      expect(await sut.getPendingAssetIds(), unorderedEquals([local1.id, local2.id]));
    });

    test('getRestorableAssetIds returns every trashed copy sharing the revived checksum', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: null);
      await markAsset(assetId: 'local1', checksum: remote.checksum, status: .trashed);
      await markAsset(assetId: 'local2', checksum: remote.checksum, status: .trashed);

      expect(await sut.getRestorableAssetIds(), unorderedEquals(['local1', 'local2']));
    });
  });

  group('pruneStaleMarkers - asset came back before trashing', () {
    test('removes marker when asset is back on server', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: null);
      await markAsset(assetId: 'asset', checksum: remote.checksum, status: .pending);

      await sut.pruneStaleMarkers();

      expect(await trashStatusOf('asset'), isNull);
    });

    test('dismissed marker is kept even after asset is back on server to prevent re-trashing it', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: null);
      await markAsset(assetId: 'asset', checksum: remote.checksum, status: .dismissed);

      await sut.pruneStaleMarkers();

      expect(await trashStatusOf('asset'), TrashSyncStatus.dismissed);
    });

    test('keeps a pending marker for asset that is still deleted', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: .new(2026, 1, 1));
      await markAsset(assetId: 'asset', checksum: remote.checksum, status: .pending);

      await sut.pruneStaleMarkers();

      expect(await trashStatusOf('asset'), TrashSyncStatus.pending);
    });

    test('does not remove a trashed marker', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: null);
      await markAsset(assetId: 'asset', checksum: remote.checksum, status: .trashed);

      await sut.pruneStaleMarkers();

      expect(await trashStatusOf('asset'), TrashSyncStatus.trashed);
    });

    test('clears review decisions after restore so a later delete becomes pending again', () async {
      final rejected = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      final approved = await backedUpAsset(ownerId: userId, remoteDeletedAt: DateTime(2026, 1, 1));
      await sut.recordSoftDeletedReviewAssets();
      await sut.markReviewAssetsRejected([rejected.localId]);
      await sut.markReviewAssetsApproved({approved.localId});
      await (ctx.db.update(ctx.db.remoteAssetEntity)..where((t) => t.id.isIn([rejected.remoteId, approved.remoteId])))
          .write(const RemoteAssetEntityCompanion(deletedAt: Value(null)));

      await sut.pruneStaleMarkers();

      expect(await trashStatusOf(rejected.localId), isNull);
      expect(await trashStatusOf(approved.localId), TrashSyncStatus.reviewApproved);

      await sut.markRestored({approved.localId});
      await sut.restoreChecksums();

      expect(await trashStatusOf(approved.localId), isNull);

      await (ctx.db.update(ctx.db.remoteAssetEntity)..where((t) => t.id.isIn([rejected.remoteId, approved.remoteId])))
          .write(RemoteAssetEntityCompanion(deletedAt: Value(DateTime(2026, 2, 1))));
      await sut.recordSoftDeletedReviewAssets();

      expect(await trashStatusOf(rejected.localId), TrashSyncStatus.pending);
      expect(await trashStatusOf(approved.localId), TrashSyncStatus.pending);
    });
  });

  group('excluded album handling', () {
    test('recordSoftDeletedAssets ignores an asset also in an excluded album', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: .new(2026, 1, 1));
      final local = await ctx.newLocalAsset(checksum: remote.checksum);
      final selected = await ctx.newLocalAlbum(backupSelection: .selected);
      final excluded = await ctx.newLocalAlbum(backupSelection: .excluded);
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: local.id);
      await ctx.newLocalAlbumAsset(albumId: excluded.id, assetId: local.id);

      await sut.recordSoftDeletedAssets();

      expect(await sut.getPendingAssetIds(), isEmpty);
    });

    test('recordSoftDeletedReviewAssets records an asset also in an excluded album', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: .new(2026, 1, 1));
      final local = await ctx.newLocalAsset(checksum: remote.checksum);
      final selected = await ctx.newLocalAlbum(backupSelection: .selected);
      final excluded = await ctx.newLocalAlbum(backupSelection: .excluded);
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: local.id);
      await ctx.newLocalAlbumAsset(albumId: excluded.id, assetId: local.id);

      await sut.recordSoftDeletedReviewAssets();

      expect(await trashStatusOf(local.id), TrashSyncStatus.pending);
    });
  });

  group('duplicate assets', () {
    test('recordSoftDeletedAssets skips duplicate asset when previous asset is dismissed', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: .new(2026, 1, 1));
      final album = await ctx.newLocalAlbum(backupSelection: .selected);
      final reimport = await ctx.newLocalAsset(checksum: remote.checksum);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: reimport.id);
      await markAsset(assetId: 'old-asset', checksum: remote.checksum, status: .dismissed);

      await sut.recordSoftDeletedAssets();

      expect(await sut.getPendingAssetIds(), isEmpty);
    });
  });

  group('prunePendingMarkers', () {
    test('removes pending marker when local asset is modified', () async {
      final local = await ctx.newLocalAsset(checksum: 'current-checksum');
      await markAsset(assetId: local.id, checksum: 'marked-checksum', status: .pending);

      await sut.prunePendingMarkers();

      expect(await trashStatusOf(local.id), isNull);
    });

    test('keeps pending marker for local asset', () async {
      final local = await ctx.newLocalAsset(checksum: 'checksum');
      await markAsset(assetId: local.id, checksum: 'checksum', status: .pending);

      await sut.prunePendingMarkers();

      expect(await trashStatusOf(local.id), TrashSyncStatus.pending);
    });

    test('keeps pending marker for missing local asset', () async {
      await markAsset(assetId: 'asset', checksum: 'checksum', status: .pending);

      await sut.prunePendingMarkers();

      expect(await trashStatusOf('asset'), TrashSyncStatus.pending);
    });
  });

  group('server deleted checksum table', () {
    Future<void> insertDeletedChecksum(String checksum) => ctx.db
        .into(ctx.db.serverDeletedChecksumEntity)
        .insert(ServerDeletedChecksumEntityCompanion.insert(checksum: checksum));

    Future<List<String>> deletedChecksums() async =>
        (await ctx.db.select(ctx.db.serverDeletedChecksumEntity).get()).map((r) => r.checksum).toList();

    group('recordHardDeletedChecksums', () {
      test('marks owned permanently deleted assets', () async {
        final remote = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 3, 4));

        await sut.recordHardDeletedChecksums([remote.id]);

        final rows = await ctx.db.select(ctx.db.serverDeletedChecksumEntity).get();
        expect(rows.map((row) => row.checksum), [remote.checksum]);
      });

      test('ignores a partner assets', () async {
        final partner = await ctx.newUser();
        final remote = await ctx.newRemoteAsset(ownerId: partner.id);

        await sut.recordHardDeletedChecksums([remote.id]);

        expect(await deletedChecksums(), isEmpty);
      });

      test('only marks local assets from backup selected album', () async {
        final album = await ctx.newLocalAlbum(backupSelection: .selected);
        final local = await ctx.newLocalAsset(checksum: 'checksum');
        await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);
        await insertDeletedChecksum('checksum');

        await sut.recordHardDeletedAssets();

        expect(await sut.getPendingAssetIds(), [local.id]);
      });

      test('ignores an excluded album asset', () async {
        final selected = await ctx.newLocalAlbum(backupSelection: .selected);
        final excluded = await ctx.newLocalAlbum(backupSelection: .excluded);
        final local = await ctx.newLocalAsset(checksum: 'checksum');
        await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: local.id);
        await ctx.newLocalAlbumAsset(albumId: excluded.id, assetId: local.id);
        await insertDeletedChecksum('checksum');

        await sut.recordHardDeletedAssets();

        expect(await sut.getPendingAssetIds(), isEmpty);
      });
    });

    group('pruneStaleMarkers', () {
      test('removes marker for asset back on the server', () async {
        await insertDeletedChecksum('checksum');
        await ctx.newRemoteAsset(ownerId: userId, deletedAt: null, checksum: 'checksum');

        await sut.pruneStaleMarkers();

        expect(await deletedChecksums(), isEmpty);
      });

      test('keeps a checksum with no owned remote asset', () async {
        await insertDeletedChecksum('checksum');

        await sut.pruneStaleMarkers();

        expect(await deletedChecksums(), ['checksum']);
      });
    });
  });

  group('owner scoping', () {
    test('recordSoftDeletedAssets: ignores trashed assets from partner', () async {
      final partner = await ctx.newUser();
      final remote = await ctx.newRemoteAsset(ownerId: partner.id, deletedAt: .new(2026, 1, 1));
      final album = await ctx.newLocalAlbum(backupSelection: .selected);
      final local = await ctx.newLocalAsset(checksum: remote.checksum);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      await sut.recordSoftDeletedAssets();

      expect(await sut.getPendingAssetIds(), isEmpty);
    });

    test('getRestorableAssetIds: ignores restore when server remote asset is only partner owned', () async {
      final partner = await ctx.newUser();
      final remote = await ctx.newRemoteAsset(ownerId: partner.id, deletedAt: null);
      await markAsset(assetId: 'asset', checksum: remote.checksum, status: .trashed);

      expect(await sut.getRestorableAssetIds(), isEmpty);
    });

    test('pruneStaleMarkers: ignores remote asset that is only partner owned', () async {
      final partner = await ctx.newUser();
      final remote = await ctx.newRemoteAsset(ownerId: partner.id, deletedAt: null);
      await markAsset(assetId: 'asset', checksum: remote.checksum, status: .pending);

      await sut.pruneStaleMarkers();

      expect(await trashStatusOf('asset'), TrashSyncStatus.pending);
    });
  });

  group('reconcileTrashed', () {
    test('dismisses a trashed marker whose local asset is not trashed', () async {
      final local = await ctx.newLocalAsset();
      await markAsset(assetId: local.id, checksum: 'checksum', status: .trashed);

      await sut.reconcileTrashed({local.id});

      expect(await trashStatusOf(local.id), TrashSyncStatus.dismissed);
    });

    test('removes a trashed marker whose local asset was deleted', () async {
      await markAsset(assetId: 'asset', checksum: 'checksum', status: .trashed);

      await sut.reconcileTrashed({'asset'});

      expect(await trashStatusOf('asset'), isNull);
    });

    test('splits a mixed batch in one call: live id dismissed, purged id deleted', () async {
      final live = await ctx.newLocalAsset();
      await markAsset(assetId: live.id, checksum: 'checksum-1', status: .trashed);
      await markAsset(assetId: 'asset', checksum: 'checksum-2', status: .trashed);

      await sut.reconcileTrashed({live.id, 'asset'});

      expect(await trashStatusOf(live.id), TrashSyncStatus.dismissed);
      expect(await trashStatusOf('asset'), isNull);
    });
  });

  group('pruneDismissedMarkers', () {
    Future<void> insertDeletedChecksum(String checksum) => ctx.db
        .into(ctx.db.serverDeletedChecksumEntity)
        .insert(ServerDeletedChecksumEntityCompanion.insert(checksum: checksum));

    test('removes a dismissed marker when its checksum is not server deleted', () async {
      await markAsset(assetId: 'asset', checksum: 'checksum', status: .dismissed);

      await sut.pruneDismissedMarkers();

      expect(await trashStatusOf('asset'), isNull);
    });

    test('keeps dismissed marker still trashed on the server', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: .new(2026, 1, 1));
      await markAsset(assetId: 'asset', checksum: remote.checksum, status: .dismissed);

      await sut.pruneDismissedMarkers();

      expect(await trashStatusOf('asset'), TrashSyncStatus.dismissed);
    });

    test('keeps dismissed marker for permanently deleted assets on server', () async {
      await insertDeletedChecksum('checksum');
      await markAsset(assetId: 'asset', checksum: 'checksum', status: .dismissed);

      await sut.pruneDismissedMarkers();

      expect(await trashStatusOf('asset'), TrashSyncStatus.dismissed);
    });

    test('removes dismissed marker of asset matching only partner trashed asset', () async {
      final partner = await ctx.newUser();
      final remote = await ctx.newRemoteAsset(ownerId: partner.id, deletedAt: .new(2026, 1, 1));
      await markAsset(assetId: 'asset', checksum: remote.checksum, status: .dismissed);

      await sut.pruneDismissedMarkers();

      expect(await trashStatusOf('asset'), isNull);
    });

    test('do not delete trashed marker when server checksum is empty', () async {
      await markAsset(assetId: 'asset', checksum: 'checksum', status: .trashed);

      await sut.pruneDismissedMarkers();

      expect(await trashStatusOf('asset'), TrashSyncStatus.trashed);
    });
  });

  group('markTrashed', () {
    test('marks trashed and removes the local asset', () async {
      final local = await ctx.newLocalAsset();
      await markAsset(assetId: local.id, checksum: 'checksum', status: .pending);

      await sut.markTrashed({local.id});

      expect(await trashStatusOf(local.id), TrashSyncStatus.trashed);
      final locals = await ctx.db.select(ctx.db.localAssetEntity).get();
      expect(locals.where((l) => l.id == local.id), isEmpty);
    });
  });

  group('markRestored', () {
    test('marks as restored, leaving the rows in place', () async {
      await markAsset(assetId: 'asset', checksum: 'checksum', status: .trashed);

      await sut.markRestored({'asset'});

      expect(await trashStatusOf('asset'), TrashSyncStatus.restored);
    });
  });

  group('restoreChecksums', () {
    test('copies the stored checksum to local asset whose modified time is unchanged', () async {
      final modifiedAt = DateTime(2026, 1, 1);
      await ctx.newLocalAsset(id: 'asset', checksumOption: const .none(), updatedAt: modifiedAt);
      await markAsset(assetId: 'asset', checksum: 'checksum', status: .restored, assetUpdatedAt: modifiedAt);

      await sut.restoreChecksums();

      expect(await checksumOf('asset'), 'checksum');
      expect(await trashStatusOf('asset'), isNull);
    });

    test('leaves the checksum null when the asset was modified after restore', () async {
      await ctx.newLocalAsset(id: 'asset', checksumOption: const .none(), updatedAt: .new(2026, 1, 1));
      await markAsset(assetId: 'asset', checksum: 'checksum', status: .restored, assetUpdatedAt: DateTime(2024, 3, 1));

      await sut.restoreChecksums();

      expect(await checksumOf('asset'), isNull);
      expect(await trashStatusOf('asset'), isNull);
    });

    test('does not overwrite a checksum the hash pass already computed', () async {
      final modifiedAt = DateTime(2026, 1, 1);
      await ctx.newLocalAsset(id: 'asset', checksum: 'checksum', updatedAt: modifiedAt);
      await markAsset(assetId: 'asset', checksum: 'old-checksum', status: .restored, assetUpdatedAt: modifiedAt);

      await sut.restoreChecksums();

      expect(await checksumOf('asset'), 'checksum');
      expect(await trashStatusOf('asset'), isNull);
    });

    test('clears restored markers even when local asset does not exist', () async {
      await markAsset(assetId: 'asset', checksum: 'checksum', status: .restored, assetUpdatedAt: .new(2026, 1, 1));

      await sut.restoreChecksums();

      expect(await trashStatusOf('asset'), isNull);
    });
  });
}

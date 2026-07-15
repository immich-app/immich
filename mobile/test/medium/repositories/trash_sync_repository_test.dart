import 'package:drift/drift.dart' show Value;
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/infrastructure/entities/server_deleted_checksum.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftTrashSyncRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = DriftTrashSyncRepository(ctx.db);
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

  group('recordSoftDeleteAssets', () {
    test('records marker when server asset is trashed', () async {
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: .new(2026, 1, 1));

      await sut.recordSoftDeleteAssets();

      expect(await sut.getPendingAssetIds(), [asset.localId]);
    });

    test('#24124: asset on server is never trashed', () async {
      await backedUpAsset(ownerId: userId, remoteDeletedAt: null);

      await sut.recordSoftDeleteAssets();

      expect(await sut.getPendingAssetIds(), isEmpty);
    });

    test('ignores assets that are not in a backup selected album', () async {
      await backedUpAsset(ownerId: userId, remoteDeletedAt: .new(2026, 1, 1), album: .none);

      await sut.recordSoftDeleteAssets();

      expect(await sut.getPendingAssetIds(), isEmpty);
    });

    test('existing marker is not duplicated', () async {
      await backedUpAsset(ownerId: userId, remoteDeletedAt: .new(2026, 1, 1));

      await sut.recordSoftDeleteAssets();
      await sut.recordSoftDeleteAssets();

      expect(await sut.getPendingAssetIds(), hasLength(1));
    });

    test('#24124: does not retrash a dismissed / restored asset', () async {
      final asset = await backedUpAsset(ownerId: userId, remoteDeletedAt: .new(2026, 1, 1));
      await markAsset(assetId: asset.localId, checksum: asset.checksum, status: .dismissed);

      await sut.recordSoftDeleteAssets();

      expect(await sut.getPendingAssetIds(), isEmpty);
      expect(await trashStatusOf(asset.localId), TrashSyncStatus.dismissed);
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
    test('recordSoftDeleteAssets records one marker per local copy', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: .new(2026, 1, 1));
      final album = await ctx.newLocalAlbum(backupSelection: .selected);
      final local1 = await ctx.newLocalAsset(checksum: remote.checksum);
      final local2 = await ctx.newLocalAsset(checksum: remote.checksum);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local1.id);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local2.id);

      await sut.recordSoftDeleteAssets();

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
  });

  group('excluded album handling', () {
    test('recordSoftDeleteAssets ignores an asset also in an excluded album', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: .new(2026, 1, 1));
      final local = await ctx.newLocalAsset(checksum: remote.checksum);
      final selected = await ctx.newLocalAlbum(backupSelection: .selected);
      final excluded = await ctx.newLocalAlbum(backupSelection: .excluded);
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: local.id);
      await ctx.newLocalAlbumAsset(albumId: excluded.id, assetId: local.id);

      await sut.recordSoftDeleteAssets();

      expect(await sut.getPendingAssetIds(), isEmpty);
    });
  });

  group('duplicate assets', () {
    test('recordSoftDeleteAssets skips duplicate asset when previous asset is dismissed', () async {
      final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: .new(2026, 1, 1));
      final album = await ctx.newLocalAlbum(backupSelection: .selected);
      final reimport = await ctx.newLocalAsset(checksum: remote.checksum);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: reimport.id);
      await markAsset(assetId: 'old-asset', checksum: remote.checksum, status: .dismissed);

      await sut.recordSoftDeleteAssets();

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
        final remote = await ctx.newRemoteAsset(ownerId: userId);

        await sut.recordHardDeletedChecksums([remote.id]);

        expect(await deletedChecksums(), [remote.checksum]);
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
    test('recordSoftDeleteAssets: ignores trashed assets from partner', () async {
      final partner = await ctx.newUser();
      final remote = await ctx.newRemoteAsset(ownerId: partner.id, deletedAt: .new(2026, 1, 1));
      final album = await ctx.newLocalAlbum(backupSelection: .selected);
      final local = await ctx.newLocalAsset(checksum: remote.checksum);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      await sut.recordSoftDeleteAssets();

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

      await sut.reconcileTrashed([local.id]);

      expect(await trashStatusOf(local.id), TrashSyncStatus.dismissed);
    });

    test('removes a trashed marker whose local asset was deleted', () async {
      await markAsset(assetId: 'asset', checksum: 'checksum', status: .trashed);

      await sut.reconcileTrashed(['asset']);

      expect(await trashStatusOf('asset'), isNull);
    });

    test('splits a mixed batch in one call: live id dismissed, purged id deleted', () async {
      final live = await ctx.newLocalAsset();
      await markAsset(assetId: live.id, checksum: 'checksum-1', status: .trashed);
      await markAsset(assetId: 'asset', checksum: 'checksum-2', status: .trashed);

      await sut.reconcileTrashed([live.id, 'asset']);

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

      await sut.markTrashed([local.id]);

      expect(await trashStatusOf(local.id), TrashSyncStatus.trashed);
      final locals = await ctx.db.select(ctx.db.localAssetEntity).get();
      expect(locals.where((l) => l.id == local.id), isEmpty);
    });
  });

  group('markRestored', () {
    test('marks as restored, leaving the rows in place', () async {
      await markAsset(assetId: 'asset', checksum: 'checksum', status: .trashed);

      await sut.markRestored(['asset']);

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

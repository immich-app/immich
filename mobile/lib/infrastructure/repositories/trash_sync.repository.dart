import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/server_deleted_checksum.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftTrashSyncRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftTrashSyncRepository(this._db) : super(_db);

  // Prunes asset markers for assets that are now live on the server
  Future<void> pruneStaleMarkers() async {
    final liveChecksums = _db.selectOnly(_db.remoteAssetEntity)
      ..addColumns([_db.remoteAssetEntity.checksum])
      ..where(_db.remoteAssetEntity.deletedAt.isNull() & _db.remoteAssetEntity.ownerId.isInQuery(currentUserIdQuery()));

    await _db.transaction(() async {
      await (_db.delete(_db.serverDeletedChecksumEntity)..where((t) => t.checksum.isInQuery(liveChecksums))).go();
      await (_db.delete(
        _db.trashSyncEntity,
      )..where((t) => t.checksum.isInQuery(liveChecksums) & t.status.equalsValue(.pending))).go();
    });
  }

  // Prunes dismissed assets marker for assets that are not on the server anymore
  Future<void> pruneDismissedMarkers() async {
    final softDeletedChecksums = _db.selectOnly(_db.remoteAssetEntity)
      ..addColumns([_db.remoteAssetEntity.checksum])
      ..where(
        _db.remoteAssetEntity.deletedAt.isNotNull() & _db.remoteAssetEntity.ownerId.isInQuery(currentUserIdQuery()),
      );

    final serverDeletedChecksums = _db.selectOnly(_db.serverDeletedChecksumEntity)
      ..addColumns([_db.serverDeletedChecksumEntity.checksum]);

    await (_db.delete(_db.trashSyncEntity)..where(
          (t) =>
              t.status.equalsValue(.dismissed) &
              t.checksum.isNotInQuery(softDeletedChecksums) &
              t.checksum.isNotInQuery(serverDeletedChecksums),
        ))
        .go();
  }

  // Prunes pending markers for assets that has been modified locally
  Future<void> prunePendingMarkers() async {
    final staleIds = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([_db.trashSyncEntity.assetId])
      ..join([
        innerJoin(
          _db.localAssetEntity,
          _db.localAssetEntity.id.equalsExp(_db.trashSyncEntity.assetId),
          useColumns: false,
        ),
      ])
      ..where(
        _db.trashSyncEntity.status.equalsValue(.pending) &
            _db.localAssetEntity.checksum.isNotNull() &
            _db.localAssetEntity.checksum.equalsExp(_db.trashSyncEntity.checksum).not(),
      );
    await (_db.delete(_db.trashSyncEntity)..where((t) => t.assetId.isInQuery(staleIds))).go();
  }

  Future<void> recordHardDeletedChecksums(Iterable<String> remoteIds) async {
    for (final slice in remoteIds.toSet().slices(kDriftMaxChunk)) {
      final checksums =
          await (_db.selectOnly(_db.remoteAssetEntity, distinct: true)
                ..addColumns([_db.remoteAssetEntity.checksum])
                ..where(
                  _db.remoteAssetEntity.id.isIn(slice) & _db.remoteAssetEntity.ownerId.isInQuery(currentUserIdQuery()),
                ))
              .map((r) => r.read(_db.remoteAssetEntity.checksum)!)
              .get();
      if (checksums.isEmpty) {
        continue;
      }

      await _db.batch((batch) {
        for (final checksum in checksums) {
          batch.insert(
            _db.serverDeletedChecksumEntity,
            ServerDeletedChecksumEntityCompanion.insert(checksum: checksum),
            onConflict: DoNothing(),
          );
        }
      });
    }
  }

  Future<void> recordSoftDeleteAssets() => _recordAssets(
    innerJoin(
      _db.remoteAssetEntity,
      _db.remoteAssetEntity.checksum.equalsExp(_db.localAssetEntity.checksum) &
          _db.remoteAssetEntity.deletedAt.isNotNull() &
          _db.remoteAssetEntity.ownerId.isInQuery(currentUserIdQuery()),
      useColumns: false,
    ),
  );

  Future<void> recordHardDeletedAssets() => _recordAssets(
    innerJoin(
      _db.serverDeletedChecksumEntity,
      _db.serverDeletedChecksumEntity.checksum.equalsExp(_db.localAssetEntity.checksum),
      useColumns: false,
    ),
  );

  Future<void> _recordAssets(Join contentJoin) async {
    final excludedAssetIds = _db.selectOnly(_db.localAlbumAssetEntity)
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..join([
        innerJoin(
          _db.localAlbumEntity,
          _db.localAlbumEntity.id.equalsExp(_db.localAlbumAssetEntity.albumId),
          useColumns: false,
        ),
      ])
      ..where(_db.localAlbumEntity.backupSelection.equalsValue(.excluded));

    final selectedAssetsQuery = _db.selectOnly(_db.localAlbumAssetEntity)
      ..addColumns([_db.localAlbumAssetEntity.assetId])
      ..where(
        _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id) &
            _db.localAlbumAssetEntity.albumId.isInQuery(
              _db.selectOnly(_db.localAlbumEntity)
                ..addColumns([_db.localAlbumEntity.id])
                ..where(_db.localAlbumEntity.backupSelection.equalsValue(.selected)),
            ),
      );

    final dismissedAssetsQuery = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([_db.trashSyncEntity.assetId])
      ..where(
        _db.trashSyncEntity.checksum.equalsExp(_db.localAssetEntity.checksum) &
            _db.trashSyncEntity.status.equalsValue(.dismissed),
      );

    final source = _db.selectOnly(_db.localAssetEntity)
      ..addColumns([_db.localAssetEntity.id, _db.localAssetEntity.checksum, _db.localAssetEntity.updatedAt])
      ..join([contentJoin])
      ..where(
        _db.localAssetEntity.checksum.isNotNull() &
            existsQuery(selectedAssetsQuery) &
            _db.localAssetEntity.id.isNotInQuery(excludedAssetIds) &
            notExistsQuery(dismissedAssetsQuery),
      );

    await _db
        .into(_db.trashSyncEntity)
        .insertFromSelect(
          source,
          columns: {
            _db.trashSyncEntity.assetId: _db.localAssetEntity.id,
            _db.trashSyncEntity.checksum: _db.localAssetEntity.checksum,
            _db.trashSyncEntity.assetUpdatedAt: _db.localAssetEntity.updatedAt,
          },
          mode: .insertOrIgnore,
        );
  }

  Future<void> markTrashed(Iterable<String> assetIds) async {
    final set = assetIds.toSet();
    if (set.isEmpty) {
      return;
    }
    await _db.transaction(() async {
      for (final slice in set.slices(kDriftMaxChunk)) {
        await (_db.update(
          _db.trashSyncEntity,
        )..where((t) => t.assetId.isIn(slice))).write(const TrashSyncEntityCompanion(status: .new(.trashed)));
        await (_db.delete(_db.localAssetEntity)..where((t) => t.id.isIn(slice))).go();
      }
    });
  }

  Future<void> markRestored(Iterable<String> assetIds) async {
    final set = assetIds.toSet();
    if (set.isEmpty) {
      return;
    }
    for (final slice in set.slices(kDriftMaxChunk)) {
      await (_db.update(
        _db.trashSyncEntity,
      )..where((t) => t.assetId.isIn(slice))).write(const TrashSyncEntityCompanion(status: .new(.restored)));
    }
  }

  Future<void> restoreChecksums() async {
    final restored = await (_db.select(_db.trashSyncEntity)..where((t) => t.status.equalsValue(.restored))).get();
    if (restored.isEmpty) {
      return;
    }

    await _db.batch((batch) {
      for (final row in restored) {
        final assetUpdatedAt = row.assetUpdatedAt;
        if (assetUpdatedAt == null) {
          continue;
        }

        batch.update(
          _db.localAssetEntity,
          LocalAssetEntityCompanion(checksum: .new(row.checksum)),
          where: (t) => t.id.equals(row.assetId) & t.checksum.isNull() & t.updatedAt.equals(assetUpdatedAt),
        );
      }

      batch.deleteWhere(_db.trashSyncEntity, (t) => t.status.equalsValue(.restored));
    });
  }

  // Mark assets that were previously marked as trashed but are now live on the device as dismissed
  Future<void> reconcileTrashed(Iterable<String> assetIds) async {
    final set = assetIds.toSet();
    if (set.isEmpty) {
      return;
    }

    JoinedSelectStatement localAssetQuery($TrashSyncEntityTable trash) => _db.selectOnly(_db.localAssetEntity)
      ..addColumns([_db.localAssetEntity.id])
      ..where(_db.localAssetEntity.id.equalsExp(trash.assetId));

    await _db.transaction(() async {
      for (final slice in set.slices(kDriftMaxChunk)) {
        await (_db.update(_db.trashSyncEntity)..where((t) => t.assetId.isIn(slice) & existsQuery(localAssetQuery(t))))
            .write(const TrashSyncEntityCompanion(status: .new(.dismissed)));

        await (_db.delete(
          _db.trashSyncEntity,
        )..where((t) => t.assetId.isIn(slice) & notExistsQuery(localAssetQuery(t)))).go();
      }
    });
  }

  Future<void> deleteMarkers(Iterable<String> assetIds) async {
    final set = assetIds.toSet();
    if (set.isEmpty) {
      return;
    }
    for (final slice in set.slices(kDriftMaxChunk)) {
      await (_db.delete(_db.trashSyncEntity)..where((t) => t.assetId.isIn(slice))).go();
    }
  }

  Future<List<String>> getPendingAssetIds() =>
      _trashSyncAssetIdsWhere(_db.trashSyncEntity.status.equalsValue(.pending));

  Future<List<String>> getTrashedAssetIds() =>
      _trashSyncAssetIdsWhere(_db.trashSyncEntity.status.equalsValue(.trashed));

  Future<List<String>> _trashSyncAssetIdsWhere(Expression<bool> filter) {
    return (_db.selectOnly(_db.trashSyncEntity)
          ..addColumns([_db.trashSyncEntity.assetId])
          ..where(filter))
        .map((row) => row.read(_db.trashSyncEntity.assetId)!)
        .get();
  }

  Future<List<String>> getRestorableAssetIds() {
    return (_db.selectOnly(_db.trashSyncEntity, distinct: true)
          ..addColumns([_db.trashSyncEntity.assetId])
          ..join([
            innerJoin(
              _db.remoteAssetEntity,
              _db.remoteAssetEntity.checksum.equalsExp(_db.trashSyncEntity.checksum),
              useColumns: false,
            ),
          ])
          ..where(
            _db.trashSyncEntity.status.equalsValue(.trashed) &
                _db.remoteAssetEntity.deletedAt.isNull() &
                _db.remoteAssetEntity.ownerId.isInQuery(currentUserIdQuery()),
          ))
        .map((row) => row.read(_db.trashSyncEntity.assetId)!)
        .get();
  }
}

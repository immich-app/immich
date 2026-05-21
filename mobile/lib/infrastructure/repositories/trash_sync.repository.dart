import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftTrashSyncRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftTrashSyncRepository(this._db) : super(_db);

  Future<void> upsertReviewCandidates(Iterable<RemoteDeletedLocalAsset> itemsToReview) async {
    if (itemsToReview.isEmpty) {
      return Future.value();
    }

    final existingEntities = <TrashSyncEntityData>[];
    final checksums = itemsToReview.map((e) => e.asset.checksum).nonNulls;
    for (final slice in checksums.slices(kDriftMaxChunk)) {
      final sliceResult = await (_db.trashSyncEntity.select()..where((tbl) => tbl.checksum.isIn(slice))).get();
      existingEntities.addAll(sliceResult);
    }

    final existingMap = {for (var e in existingEntities) e.checksum: e};
    return _db.batch((batch) {
      for (var item in itemsToReview) {
        final checksum = item.asset.checksum!;
        final existing = existingMap[checksum];
        if (existing == null ||
            (existing.isSyncApproved == null && item.remoteDeletedAt.isAfter(existing.remoteDeletedAt))) {
          batch.insert(
            _db.trashSyncEntity,
            TrashSyncEntityCompanion.insert(checksum: checksum, remoteDeletedAt: item.remoteDeletedAt),
            onConflict: DoUpdate(
              (_) => TrashSyncEntityCompanion.custom(
                remoteDeletedAt: Variable(item.remoteDeletedAt),
                isSyncApproved: const Variable(null),
              ),
            ),
          );
        }
      }
    });
  }

  Future<void> updateApproves(Iterable<String> checksums, bool isSyncApproved) {
    if (checksums.isEmpty) {
      return Future.value();
    }
    return _db.batch((batch) {
      for (final slice in checksums.slices(kDriftMaxChunk)) {
        batch.update(
          _db.trashSyncEntity,
          TrashSyncEntityCompanion(isSyncApproved: Value(isSyncApproved)),
          where: (tbl) => tbl.checksum.isIn(slice),
        );
      }
    });
  }

  Future<int> deleteOutdated(Iterable<String> remoteIds) async {
    var deletedMatched = 0;
    for (final slice in remoteIds.toSet().slices(kDriftMaxChunk)) {
      final remoteAliveSelect = _db.selectOnly(_db.remoteAssetEntity)
        ..addColumns([_db.remoteAssetEntity.checksum])
        ..where(_db.remoteAssetEntity.id.isIn(slice) & _db.remoteAssetEntity.deletedAt.isNull());

      final query = _db.delete(_db.trashSyncEntity)..where((row) => row.checksum.isInQuery(remoteAliveSelect));

      deletedMatched += await query.go();
    }
    return deletedMatched;
  }

  Future<int> deleteResolved(Iterable<String> checksums) async {
    final checksumSet = checksums.toSet();
    if (checksumSet.isEmpty) {
      return Future.value(0);
    }

    var deletedMatched = 0;
    for (final slice in checksumSet.slices(kDriftMaxChunk)) {
      final query = _db.delete(_db.trashSyncEntity)
        ..where((row) => row.checksum.isIn(slice) & row.isSyncApproved.isNotValue(true));

      deletedMatched += await query.go();
    }
    return deletedMatched;
  }

  Future<int> cleanupLocalTrashSync() async {
    final orphanedReviews = await _deleteOrphanedReviews();
    final staleReviews = await _deleteStaleReviewsThrottled();
    return orphanedReviews + staleReviews;
  }

  Future<int> _deleteOrphanedReviews() {
    final localAssetChecksums = _db.selectOnly(_db.localAssetEntity)
      ..addColumns([_db.localAssetEntity.checksum])
      ..where(_db.localAssetEntity.checksum.isNotNull());

    final query = _db.delete(_db.trashSyncEntity)
      ..where((row) => row.checksum.isNotInQuery(localAssetChecksums) & row.isSyncApproved.isNotValue(true));

    return query.go();
  }

  Future<int> _deleteStaleReviewsThrottled({Duration minInterval = const Duration(hours: 8)}) async {
    final lastRunMillis = await _getLastCleanupTimeMillis();
    final nowMillis = DateTime.now().millisecondsSinceEpoch;
    if (lastRunMillis != null && nowMillis - lastRunMillis < minInterval.inMilliseconds) {
      return 0;
    }

    final result = await _cleanupOutdatedEntries();
    await _setLastCleanupTimeMillis(nowMillis);
    return result;
  }

  Future<int> _cleanupOutdatedEntries() async {
    final remoteAliveSelect = _db.selectOnly(_db.remoteAssetEntity)
      ..addColumns([_db.remoteAssetEntity.checksum])
      ..where(_db.remoteAssetEntity.deletedAt.isNull());

    final query = _db.delete(_db.trashSyncEntity)..where((row) => row.checksum.isInQuery(remoteAliveSelect));

    final deletedMatched = await query.go();

    final localTrashedChecksums = _db.selectOnly(_db.trashedLocalAssetEntity)
      ..addColumns([_db.trashedLocalAssetEntity.checksum])
      ..where(_db.trashedLocalAssetEntity.checksum.isNotNull());

    final orphanQuery = _db.delete(_db.trashSyncEntity)
      ..where((row) => row.isSyncApproved.equals(true) & row.checksum.isNotInQuery(localTrashedChecksums));

    final deletedOrphans = await orphanQuery.go();

    return deletedMatched + deletedOrphans;
  }

  Stream<int> watchPendingApprovalAssetCount() {
    final countExpr = _db.trashSyncEntity.checksum.count(distinct: true);

    final q = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([countExpr])
      ..where(_db.trashSyncEntity.isSyncApproved.isNull() & _hasEligibleLocalAssetForPendingReview());

    return q.watchSingle().map((row) => row.read(countExpr) ?? 0).distinct();
  }

  Stream<bool> watchIsAssetApprovalPending(String checksum) {
    final query = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([_db.trashSyncEntity.checksum])
      ..where(
        _db.trashSyncEntity.checksum.equals(checksum) &
            _db.trashSyncEntity.isSyncApproved.isNull() &
            _hasEligibleLocalAssetForPendingReview(),
      )
      ..limit(1);
    return query.watchSingleOrNull().map((row) => row != null).distinct();
  }

  Expression<bool> _hasEligibleLocalAssetForPendingReview() {
    final selectedAlbumAssets =
        _db.localAlbumAssetEntity.selectOnly().join([
            innerJoin(
              _db.localAlbumEntity,
              _db.localAlbumAssetEntity.albumId.equalsExp(_db.localAlbumEntity.id),
              useColumns: false,
            ),
          ])
          ..addColumns([_db.localAlbumAssetEntity.assetId])
          ..where(
            _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id) &
                _db.localAlbumEntity.backupSelection.equalsValue(BackupSelection.selected),
          );

    final eligibleLocalAssets = _db.localAssetEntity.selectOnly()
      ..addColumns([_db.localAssetEntity.id])
      ..where(_db.localAssetEntity.checksum.equalsExp(_db.trashSyncEntity.checksum) & existsQuery(selectedAlbumAssets))
      ..limit(1);

    return existsQuery(eligibleLocalAssets);
  }

  Future<int?> _getLastCleanupTimeMillis() async {
    final entity = await _db.managers.storeEntity
        .filter((entity) => entity.id.equals(StoreKey.trashSyncLastCleanup.id))
        .getSingleOrNull();
    return entity?.intValue;
  }

  Future<void> _setLastCleanupTimeMillis(int millis) async {
    await _db.storeEntity.insertOnConflictUpdate(
      StoreEntityCompanion(id: Value(StoreKey.trashSyncLastCleanup.id), intValue: Value(millis)),
    );
  }
}

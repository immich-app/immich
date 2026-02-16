import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.dart';
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
        final existing = existingMap[item.asset.checksum];
        if (existing == null ||
            (existing.isSyncApproved == false && item.remoteDeletedAt.isAfter(existing.remoteDeletedAt))) {
          batch.insert(
            _db.trashSyncEntity,
            TrashSyncEntityCompanion.insert(checksum: item.asset.checksum!, remoteDeletedAt: item.remoteDeletedAt),
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

  Future<int> deleteOutdated() async {
    final remoteAliveSelect = _db.selectOnly(_db.remoteAssetEntity)
      ..addColumns([_db.remoteAssetEntity.checksum])
      ..where(_db.remoteAssetEntity.deletedAt.isNull());

    final localTrashedSelect = _db.selectOnly(_db.trashedLocalAssetEntity)
      ..addColumns([_db.trashedLocalAssetEntity.checksum]);

    final query = _db.delete(_db.trashSyncEntity)
      ..where((row) => row.isSyncApproved.isNull() | row.isSyncApproved.equals(false))
      ..where((row) => row.checksum.isInQuery(remoteAliveSelect) | row.checksum.isInQuery(localTrashedSelect));

    final deletedMatched = await query.go();

    final localTrashedChecksums = _db.selectOnly(_db.trashedLocalAssetEntity)
      ..addColumns([_db.trashedLocalAssetEntity.checksum])
      ..where(_db.trashedLocalAssetEntity.checksum.isNotNull());

    final localAssetChecksums = _db.selectOnly(_db.localAssetEntity)
      ..addColumns([_db.localAssetEntity.checksum])
      ..where(_db.localAssetEntity.checksum.isNotNull());

    final orphanQuery = _db.delete(_db.trashSyncEntity)
      ..where(
        (row) =>
            (row.isSyncApproved.equals(false) & row.checksum.isNotInQuery(localAssetChecksums)) |
            (row.isSyncApproved.equals(true) & row.checksum.isNotInQuery(localTrashedChecksums)),
      );

    final deletedOrphans = await orphanQuery.go();

    return deletedMatched + deletedOrphans;
  }

  Future<int> deleteOutdatedThrottled({Duration minInterval = const Duration(hours: 8)}) async {
    final lastRunMillis = await _getLastCleanupTimeMillis();
    final nowMillis = DateTime.now().millisecondsSinceEpoch;
    if (lastRunMillis != null && nowMillis - lastRunMillis < minInterval.inMilliseconds) {
      return 0;
    }

    final result = await deleteOutdated();
    await _setLastCleanupTimeMillis(nowMillis);
    return result;
  }

  Stream<int> watchPendingApprovalAssetCount() {
    final countExpr = _db.trashSyncEntity.checksum.count(distinct: true);

    final q = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([countExpr])
      ..where(_db.trashSyncEntity.isSyncApproved.isNull());

    return q.watchSingle().map((row) => row.read(countExpr) ?? 0).distinct();
  }

  Stream<bool> watchIsAssetApprovalPending(String checksum) {
    final query = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([_db.trashSyncEntity.checksum])
      ..where((_db.trashSyncEntity.checksum.equals(checksum) & _db.trashSyncEntity.isSyncApproved.isNull()))
      ..limit(1);
    return query.watchSingleOrNull().map((row) => row != null).distinct();
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

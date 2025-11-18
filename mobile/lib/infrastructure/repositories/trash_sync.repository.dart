import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftTrashSyncRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftTrashSyncRepository(this._db) : super(_db);

  Future<void> upsertWithActionTypeCheck(Iterable<LocalAsset> itemsToReview) async {
    if (itemsToReview.isEmpty) {
      return Future.value();
    }

    final existingEntities = <TrashSyncEntityData>[];
    final assetIds = itemsToReview.map((e) => e.id);
    for (final slice in assetIds.slices(kDriftMaxChunk)) {
      final sliceResult = await (_db.trashSyncEntity.select()..where((tbl) => tbl.assetId.isIn(slice))).get();
      existingEntities.addAll(sliceResult);
    }

    final existingMap = {for (var e in existingEntities) e.assetId: e};

    return _db.batch((batch) {
      for (var item in itemsToReview) {
        final existing = existingMap[item.id];
        if (existing == null ||
            (existing.isSyncApproved == false && item.remoteDeletedAt!.isAfter(existing.createdAt))) {
          batch.insert(
            _db.trashSyncEntity,
            TrashSyncEntityCompanion.insert(
              assetId: item.id,
              checksum: item.checksum!,
              createdAt: Value(item.remoteDeletedAt!),
            ),
            onConflict: DoUpdate(
              (_) => TrashSyncEntityCompanion.custom(
                createdAt: Variable(item.remoteDeletedAt),
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
      batch.update(
        _db.trashSyncEntity,
        TrashSyncEntityCompanion(isSyncApproved: Value(isSyncApproved)),
        where: (tbl) => tbl.checksum.isIn(checksums),
      );
    });
  }

  Future<int> deleteAlreadySynced() async {
    final remoteAliveSelect = _db.selectOnly(_db.remoteAssetEntity)
      ..addColumns([_db.remoteAssetEntity.checksum])
      ..where(_db.remoteAssetEntity.deletedAt.isNull());

    final localTrashedSelect = _db.selectOnly(_db.trashedLocalAssetEntity)
      ..addColumns([_db.trashedLocalAssetEntity.checksum]);

    final query = _db.delete(_db.trashSyncEntity)
      ..where((row) => row.isSyncApproved.isNull() | row.isSyncApproved.equals(false))
      ..where((row) => row.checksum.isInQuery(remoteAliveSelect) | row.checksum.isInQuery(localTrashedSelect));

    return query.go();
  }

  Stream<int> watchPendingApprovalCount() {
    final countExpr = _db.trashSyncEntity.checksum.count(distinct: true);

    final q = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([countExpr])
      ..where(_db.trashSyncEntity.isSyncApproved.isNull());

    return q.watchSingle().map((row) => row.read(countExpr) ?? 0).distinct();
  }

  Stream<bool> watchIsApprovalPending(String checksum) {
    final query = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([_db.trashSyncEntity.checksum])
      ..where((_db.trashSyncEntity.checksum.equals(checksum) & _db.trashSyncEntity.isSyncApproved.isNull()))
      ..limit(1);
    return query.watchSingleOrNull().map((row) => row != null).distinct();
  }

  Stream<Set<String>> watchPendingApprovalChecksums() {
    final query = _db.select(_db.trashSyncEntity)..where((t) => t.isSyncApproved.isNull());
    return query
        .watch()
        .map((rows) => rows.map((e) => e.checksum).toSet())
        .distinct((previous, next) => const SetEquality<String>().equals(previous, next));
  }
}

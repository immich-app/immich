import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/trash_sync.model.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftTrashSyncRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftTrashSyncRepository(this._db) : super(_db);

  // Future<void> insertIfNotExists(Iterable<ReviewItem> itemsToReview, TrashActionType actionType) async {
  //   if (itemsToReview.isEmpty) {
  //     return Future.value();
  //   }
  //
  //   final alreadyExistChecksums =
  //       await (_db.trashSyncEntity.select()..where((tbl) => tbl.checksum.isIn(itemsToReview.map((e) => e.checksum))))
  //           .map((e) => e.checksum)
  //           .get();
  //
  //   final toInsert = itemsToReview
  //       .where((e) => !alreadyExistChecksums.contains(e.checksum))
  //       .map(
  //         (e) => TrashSyncEntityCompanion.insert(assetId: e.localAssetId, checksum: e.checksum, actionType: actionType),
  //       )
  //       .toList();
  //
  //   if (toInsert.isEmpty) {
  //     return Future.value();
  //   }
  //   return _db.batch((batch) {
  //     batch.insertAll(_db.trashSyncEntity, toInsert);
  //   });
  // }

  Future<void> upsertWithActionTypeCheck(Iterable<ReviewItem> itemsToReview, TrashActionType actionType) async {
    if (itemsToReview.isEmpty) {
      return Future.value();
    }

    /* remove it on
    * localAssetId - unique for device storage volume
    * checksum - unique in remote for particular library, not unique for local asset, trashed local asset, trash sync event
    */

    final assetIds = itemsToReview.map((e) => e.localAssetId).toList();

    // final existingEntities = await (_db.trashSyncEntity.select()..where((tbl) => tbl.assetId.isIn(assetIds))).get();

    final existingEntities = <TrashSyncEntityData>[];

    for (final slice in assetIds.slices(kDriftMaxChunk)) {
      final sliceResult = await (_db.trashSyncEntity.select()..where((tbl) => tbl.assetId.isIn(slice))).get();
      existingEntities.addAll(sliceResult);
    }

    final existingMap = {for (var e in existingEntities) e.assetId: e};

    return _db.batch((batch) {
      for (var item in itemsToReview) {
        final existing = existingMap[item.localAssetId];
        if (existing?.actionType != actionType) {
          batch.insert(
            _db.trashSyncEntity,
            TrashSyncEntityCompanion.insert(
              assetId: item.localAssetId,
              checksum: item.checksum,
              actionType: actionType,
            ),
            onConflict: DoUpdate(
              (_) => TrashSyncEntityCompanion.custom(
                actionType: Variable(actionType.index),
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

  Future<void> deleteUnapproved(Iterable<String> checksums) {
    if (checksums.isEmpty) {
      return Future.value();
    }
    return _db.batch((batch) {
      for (final slice in checksums.slices(kDriftMaxChunk)) {
        batch.deleteWhere(_db.trashSyncEntity, (e) => e.checksum.isIn(slice) & e.isSyncApproved.isNotValue(true));
      }
    });
  }

  Future<int> deleteAlreadySynced() async {
    final remoteAliveSelect = _db.selectOnly(_db.remoteAssetEntity)
      ..addColumns([_db.remoteAssetEntity.checksum])
      ..where(_db.remoteAssetEntity.deletedAt.isNull());

    final remoteTrashedSelect = _db.selectOnly(_db.remoteAssetEntity)
      ..addColumns([_db.remoteAssetEntity.checksum])
      ..where(_db.remoteAssetEntity.deletedAt.isNotNull());

    final localAliveSelect = _db.selectOnly(_db.localAssetEntity)..addColumns([_db.localAssetEntity.checksum]);

    final localTrashedSelect = _db.selectOnly(_db.trashedLocalAssetEntity)
      ..addColumns([_db.trashedLocalAssetEntity.checksum]);

    return (_db.delete(_db.trashSyncEntity)..where((row) {
          final notApproved = row.isSyncApproved.isNull() | row.isSyncApproved.equals(false);

          final remoteAlive = row.checksum.isInQuery(remoteAliveSelect);
          final remoteTrashed = row.checksum.isInQuery(remoteTrashedSelect);
          final localAlive = row.checksum.isInQuery(localAliveSelect);
          final localTrashed = row.checksum.isInQuery(localTrashedSelect);

          final bothAlive = remoteAlive & localAlive;
          final bothTrashed = remoteTrashed & localTrashed;

          final outdated =
              (remoteAlive & row.actionType.equalsValue(TrashActionType.trashed)) |
              (localAlive & row.actionType.equalsValue(TrashActionType.restored)) |
              (remoteTrashed & localAlive & row.actionType.equalsValue(TrashActionType.restored)) |
              (remoteAlive & localTrashed & row.actionType.equalsValue(TrashActionType.trashed));

          final synced = bothAlive | bothTrashed;

          return notApproved & (synced | outdated);
        }))
        .go();
  }

  Stream<int> watchPendingApprovalCount(TrashActionType? actionType) {
    final countExpr = _db.trashSyncEntity.assetId.count();
    final q = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([countExpr])
      ..where(_db.trashSyncEntity.isSyncApproved.isNull());

    if (actionType != null) {
      q.where(_db.trashSyncEntity.actionType.equalsValue(actionType));
    }
    return q.watchSingle().map((row) => row.read(countExpr) ?? 0).distinct();
  }

  Future<int> getPendingApprovalCount() async {
    final countExpr = _db.trashSyncEntity.assetId.count();
    final q = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([countExpr])
      ..where(_db.trashSyncEntity.isSyncApproved.isNull());
    final row = await q.getSingleOrNull();
    return row?.read(countExpr) ?? 0;
  }

  // Stream<bool> watchIsApprovalPending(String checksum) {
  //   return (_db.select(_db.trashSyncEntity)
  //     ..where((t) => t.checksum.equals(checksum) & t.isSyncApproved.isNull()))
  //       .watch()
  //       .map((rows) => rows.isNotEmpty);
  // }

  Stream<Set<String>> watchPendingApprovalChecksums() {
    final query = _db.select(_db.trashSyncEntity)..where((t) => t.isSyncApproved.isNull());
    return query
        .watch()
        .map((rows) => rows.map((e) => e.checksum).toSet())
        .distinct((previous, next) => const SetEquality<String>().equals(previous, next));
  }

  Future<List<TrashSyncDecision>> getByChecksums(Iterable<String> checksums) {
    if (checksums.isEmpty) return Future.value([]);
    final query = _db.trashSyncEntity.select()..where((tbl) => tbl.checksum.isIn(checksums));
    return query.map((row) => row.toDto()).get();
  }
}

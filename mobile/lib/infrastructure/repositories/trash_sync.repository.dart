import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/trash_sync.model.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftTrashSyncRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftTrashSyncRepository(this._db) : super(_db);

  Future<void> insertIfNotExists(Iterable<({String localAssetId, String checksum})> itemsToReview) async {
    if (itemsToReview.isEmpty) {
      return Future.value();
    }

    final alreadyExistChecksums =
        await (_db.trashSyncEntity.select()..where((tbl) => tbl.checksum.isIn(itemsToReview.map((e) => e.checksum))))
            .map((e) => e.checksum)
            .get();

    final toInsert = itemsToReview
        .where((e) => !alreadyExistChecksums.contains(e.checksum))
        .map((e) => TrashSyncEntityCompanion.insert(assetId: e.localAssetId, checksum: e.checksum))
        .toList();

    if (toInsert.isEmpty) {
      return Future.value();
    }
    return _db.batch((batch) {
      batch.insertAll(_db.trashSyncEntity, toInsert);
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

  Future<void> delete(List<String> ids) {
    if (ids.isEmpty) {
      return Future.value();
    }
    return _db.batch((batch) {
      for (final slice in ids.slices(32000)) {
        batch.deleteWhere(_db.trashSyncEntity, (e) => e.assetId.isIn(slice));
      }
    });
  }

  Future<void> deleteAll() {
    return _db.batch((batch) {
      batch.deleteAll(_db.trashSyncEntity);
    });
  }

  Future<int> getCount() {
    return _db.managers.trashSyncEntity.count();
  }

  Stream<int> watchPendingDecisionCount() {
    final countExpr = _db.trashSyncEntity.assetId.count();
    final q = _db.selectOnly(_db.trashSyncEntity)
      ..addColumns([countExpr])
      ..where(_db.trashSyncEntity.isSyncApproved.isNull());
    return q.watchSingle().map((row) => row.read(countExpr) ?? 0).distinct();
  }

  Future<List<TrashSyncDecision>> getByChecksums(Iterable<String> checksums) {
    if (checksums.isEmpty) return Future.value([]);
    final query = _db.trashSyncEntity.select()..where((tbl) => tbl.checksum.isIn(checksums));
    return query.map((row) => row.toDto()).get();
  }
}

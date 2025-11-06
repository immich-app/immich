import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset_upload_entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';

class DriftLocalAssetUploadRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftLocalAssetUploadRepository(this._db) : super(_db);

  Future<List<DriftUploadStatus>> getAll() async {
    final query = _db.localAssetUploadEntity.select().addColumns([_db.localAssetEntity.name]).join([
      leftOuterJoin(
        _db.localAssetEntity,
        _db.localAssetEntity.id.equalsExp(_db.localAssetUploadEntity.assetId),
        useColumns: false,
      ),
    ]);
    final results = await query.get();
    return results.map((row) {
      final upload = row.readTable(_db.localAssetUploadEntity);
      final assetName = row.read(_db.localAssetEntity.name)!;
      return DriftUploadStatus(taskId: upload.assetId, filename: assetName, error: upload.errorMessage, isFailed: true);
    }).toList();
  }

  Future<void> upsert(String assetId, UploadErrorType errorType, String error) {
    return _db
        .into(_db.localAssetUploadEntity)
        .insert(
          LocalAssetUploadEntityCompanion(
            assetId: Value(assetId),
            numberOfAttempts: const Value(1),
            lastAttemptAt: Value(DateTime.now()),
            errorType: Value(errorType),
            errorMessage: Value(error),
          ),
          onConflict: DoUpdate(
            (old) => LocalAssetUploadEntityCompanion.custom(
              numberOfAttempts: (old.numberOfAttempts + const Constant(1)),
              lastAttemptAt: currentDateAndTime,
              errorType: Variable.withInt(errorType.index),
              errorMessage: Variable.withString(error),
            ),
          ),
        );
  }

  Future<void> delete(String assetId) async {
    await _db.managers.localAssetUploadEntity.filter((row) => row.assetId.id.equals(assetId)).delete();
  }
}

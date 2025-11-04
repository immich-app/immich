import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset_upload_entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftLocalAssetUploadRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftLocalAssetUploadRepository(this._db) : super(_db);

  Future<void> upsert(String assetId, UploadErrorType errorType) {
    return _db
        .into(_db.localAssetUploadEntity)
        .insert(
          LocalAssetUploadEntityCompanion(
            assetId: Value(assetId),
            numberOfAttempts: const Value(1),
            lastAttemptAt: Value(DateTime.now()),
            errorType: Value(errorType),
          ),
          onConflict: DoUpdate(
            (old) => LocalAssetUploadEntityCompanion.custom(
              numberOfAttempts: (old.numberOfAttempts + const Constant(1)),
              lastAttemptAt: currentDateAndTime,
              errorType: Variable.withInt(errorType.index),
            ),
          ),
        );
  }
}

import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart'
    hide ExifInfo;
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftRemoteAssetRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftRemoteAssetRepository(this._db) : super(_db);

  Future<ExifInfo?> getExif(String id) {
    return _db.managers.remoteExifEntity
        .filter((row) => row.assetId.id.equals(id))
        .map((row) => row.toDto())
        .getSingleOrNull();
  }
}

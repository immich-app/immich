import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/remote_asset.interface.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftRemoteAssetRepository extends DriftDatabaseRepository
    implements IRemoteAssetRepository {
  final Drift _db;
  const DriftRemoteAssetRepository(this._db) : super(_db);
}

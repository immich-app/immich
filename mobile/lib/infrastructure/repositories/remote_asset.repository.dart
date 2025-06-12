import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/remote_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftRemoteAssetRepository extends DriftDatabaseRepository
    implements IRemoteAssetRepository {
  final Drift _db;
  const DriftRemoteAssetRepository(this._db) : super(_db);

  @override
  Future<Asset> getAsset(String id) {
    final query = _db.remoteAssetEntity.select()
      ..where((a) => a.id.equals(id));

    return query
        .map((row) => row.toDto())
        .getSingle();
  }
}

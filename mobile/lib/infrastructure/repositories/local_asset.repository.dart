import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftLocalAssetRepository extends DriftDatabaseRepository
    implements ILocalAssetRepository {
  final Drift _db;
  const DriftLocalAssetRepository(this._db) : super(_db);

  @override
  Future<LocalAsset> get(String id) => _db.managers.localAssetEntity
      .filter((f) => f.localId(id))
      .map((a) => a.toDto())
      .getSingle();
}

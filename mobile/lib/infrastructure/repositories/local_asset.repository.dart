import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftLocalAssetRepository extends DriftDatabaseRepository
    implements ILocalAssetRepository {
  final Drift _db;
  const DriftLocalAssetRepository(this._db) : super(_db);

  @override
  Future<void> updateHashes(Iterable<LocalAsset> hashes) {
    if (hashes.isEmpty) {
      return Future.value();
    }

    return _db.batch((batch) async {
      for (final asset in hashes) {
        batch.update(
          _db.localAssetEntity,
          LocalAssetEntityCompanion(checksum: Value(asset.checksum)),
          where: (e) => e.id.equals(asset.id),
        );
      }
    });
  }
}

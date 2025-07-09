import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftLocalAssetRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftLocalAssetRepository(this._db) : super(_db);

  Stream<LocalAsset?> watchAsset(String id) {
    final query = _db.localAssetEntity
        .select()
        .addColumns([_db.remoteAssetEntity.id]).join([
      leftOuterJoin(
        _db.remoteAssetEntity,
        _db.localAssetEntity.checksum.equalsExp(_db.remoteAssetEntity.checksum),
        useColumns: false,
      ),
    ])
      ..where(_db.localAssetEntity.id.equals(id));

    return query.map((row) {
      final asset = row.readTable(_db.localAssetEntity).toDto();
      return asset.copyWith(
        remoteId: row.read(_db.remoteAssetEntity.id),
      );
    }).watchSingleOrNull();
  }

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

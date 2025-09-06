import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

typedef LocalAssetHashMapping = ({String assetId, String checksum});

class DriftLocalAssetRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftLocalAssetRepository(this._db) : super(_db);

  SingleOrNullSelectable<LocalAsset?> _assetSelectable(String id) {
    final query = _db.localAssetEntity.select().addColumns([_db.remoteAssetEntity.id]).join([
      leftOuterJoin(
        _db.remoteAssetEntity,
        _db.localAssetEntity.checksum.equalsExp(_db.remoteAssetEntity.checksum),
        useColumns: false,
      ),
    ])..where(_db.localAssetEntity.id.equals(id));

    return query.map((row) {
      final asset = row.readTable(_db.localAssetEntity).toDto();
      return asset.copyWith(remoteId: row.read(_db.remoteAssetEntity.id));
    });
  }

  Future<LocalAsset?> get(String id) => _assetSelectable(id).getSingleOrNull();

  Stream<LocalAsset?> watch(String id) => _assetSelectable(id).watchSingleOrNull();

  Future<void> updateHashes(Iterable<LocalAssetHashMapping> hashes) {
    if (hashes.isEmpty) {
      return Future.value();
    }

    return _db.batch((batch) async {
      for (final mapping in hashes) {
        batch.update(
          _db.localAssetEntity,
          LocalAssetEntityCompanion(checksum: Value(mapping.checksum)),
          where: (e) => e.id.equals(mapping.assetId),
        );
      }
    });
  }

  Future<void> delete(List<String> ids) {
    if (ids.isEmpty) {
      return Future.value();
    }

    return _db.batch((batch) {
      for (final slice in ids.slices(32000)) {
        batch.deleteWhere(_db.localAssetEntity, (e) => e.id.isIn(slice));
      }
    });
  }

  Future<LocalAsset?> getById(String id) {
    final query = _db.localAssetEntity.select()..where((lae) => lae.id.equals(id));

    return query.map((row) => row.toDto()).getSingleOrNull();
  }

  Future<int> getCount() {
    return _db.managers.localAssetEntity.count();
  }

  Future<int> getHashedCount() {
    return _db.managers.localAssetEntity.filter((e) => e.checksum.isNull().not()).count();
  }

  Future<List<LocalAssetHashMapping>> getHashMappingFromCloudId() async {
    final query =
        _db.localAssetEntity.selectOnly().join([
            leftOuterJoin(
              _db.remoteAssetCloudIdEntity,
              _db.localAssetEntity.cloudId.equalsExp(_db.remoteAssetCloudIdEntity.cloudId),
              useColumns: false,
            ),
            leftOuterJoin(
              _db.remoteAssetEntity,
              _db.remoteAssetCloudIdEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
              useColumns: false,
            ),
          ])
          ..addColumns([_db.localAssetEntity.id, _db.remoteAssetEntity.checksum])
          ..where(_db.remoteAssetCloudIdEntity.cloudId.isNotNull() & _db.localAssetEntity.checksum.isNull());
    return query
        .map(
          (row) => (assetId: row.read(_db.localAssetEntity.id)!, checksum: row.read(_db.remoteAssetEntity.checksum)!),
        )
        .get();
  }
}

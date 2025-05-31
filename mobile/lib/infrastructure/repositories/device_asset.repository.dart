import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/local_asset_hash.model.dart';
import 'package:immich_mobile/domain/models/device_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/device_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset_hash.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:isar/isar.dart';

class IsarDeviceAssetRepository extends IsarDatabaseRepository
    implements IDeviceAssetRepository {
  final Isar _db;

  const IsarDeviceAssetRepository(this._db) : super(_db);

  @override
  Future<void> deleteIds(List<String> ids) {
    return transaction(() async {
      await _db.deviceAssetEntitys.deleteAllByAssetId(ids.toList());
    });
  }

  @override
  Future<List<DeviceAsset>> getByIds(List<String> localIds) {
    return _db.deviceAssetEntitys
        .where()
        .anyOf(localIds, (query, id) => query.assetIdEqualTo(id))
        .findAll()
        .then((value) => value.map((e) => e.toModel()).toList());
  }

  @override
  Future<bool> updateAll(List<DeviceAsset> assetHash) {
    return transaction(() async {
      await _db.deviceAssetEntitys
          .putAll(assetHash.map(DeviceAssetEntity.fromDto).toList());
      return true;
    });
  }
}

class DriftLocalAssetHashRepository extends DriftDatabaseRepository
    implements ILocalAssetHashRepository {
  final Drift _db;
  const DriftLocalAssetHashRepository(super.db) : _db = db;

  @override
  Future<List<LocalAssetHash>> getByIds(Iterable<String> localIds) =>
      _db.managers.localAssetHashEntity
          .filter((e) => e.id.isIn(localIds))
          .orderBy((r) => r.id.asc())
          .map(
            (row) => LocalAssetHash(
              id: row.id,
              checksum: row.checksum,
              updatedAt: row.updatedAt,
            ),
          )
          .get();

  @override
  Future<void> handleDelta({
    List<LocalAsset> updates = const [],
    List<String> deletes = const [],
  }) =>
      _db.transaction(() async {
        if (updates.isNotEmpty) {
          await _db.batch((batch) {
            batch.insertAllOnConflictUpdate(
              _db.localAssetHashEntity,
              updates.map(
                (e) => LocalAssetHashEntityCompanion.insert(
                  id: e.id,
                  updatedAt: Value(e.updatedAt),
                  checksum: e.checksum!,
                ),
              ),
            );
          });
        }

        if (deletes.isNotEmpty) {
          await _db.localAssetHashEntity.deleteWhere((e) => e.id.isIn(deletes));
        }
      });
}

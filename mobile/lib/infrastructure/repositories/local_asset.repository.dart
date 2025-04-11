import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftLocalAssetRepository extends DriftDatabaseRepository
    implements ILocalAssetRepository {
  final Drift _db;
  const DriftLocalAssetRepository(this._db) : super(_db);

  @override
  Future<void> deleteIds(Iterable<String> ids) => _db.batch(
        (batch) => batch.deleteWhere(
          _db.localAssetEntity,
          (f) => f.localId.isIn(ids),
        ),
      );

  @override
  Future<void> upsertAll(Iterable<LocalAsset> localAssets) =>
      _db.batch((batch) async {
        batch.insertAllOnConflictUpdate(
          _db.localAssetEntity,
          localAssets.map(
            (a) => LocalAssetEntityCompanion.insert(
              name: a.name,
              type: a.type,
              createdAt: Value(a.createdAt),
              updatedAt: Value(a.updatedAt),
              width: Value.absentIfNull(a.width),
              height: Value.absentIfNull(a.height),
              durationInSeconds: Value.absentIfNull(a.durationInSeconds),
              localId: a.localId,
              checksum: Value.absentIfNull(a.checksum),
            ),
          ),
        );
      });

  @override
  Future<LocalAsset> get(String assetId) => _db.managers.localAssetEntity
      .filter((f) => f.localId(assetId))
      .map((a) => a.toDto())
      .getSingle();
}

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftMemoryRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftMemoryRepository(this._db) : super(_db);

  Future<List<DriftMemory>> getAll(String ownerId) async {
    final now = DateTime.now();
    final localUtc = DateTime.utc(now.year, now.month, now.day, 0, 0, 0);

    final query = _db.select(_db.memoryEntity).join([
      leftOuterJoin(
        _db.memoryAssetEntity,
        _db.memoryAssetEntity.memoryId.equalsExp(_db.memoryEntity.id),
      ),
      leftOuterJoin(
        _db.remoteAssetEntity,
        _db.remoteAssetEntity.id.equalsExp(_db.memoryAssetEntity.assetId) &
            _db.remoteAssetEntity.deletedAt.isNull() &
            _db.remoteAssetEntity.visibility
                .equalsValue(AssetVisibility.timeline),
      ),
    ])
      ..where(_db.memoryEntity.ownerId.equals(ownerId))
      ..where(_db.memoryEntity.deletedAt.isNull())
      ..where(
        _db.memoryEntity.showAt.isSmallerOrEqualValue(localUtc),
      )
      ..where(
        _db.memoryEntity.hideAt.isBiggerOrEqualValue(localUtc),
      )
      ..orderBy([
        OrderingTerm.desc(_db.memoryEntity.memoryAt),
        OrderingTerm.asc(_db.remoteAssetEntity.createdAt),
      ]);

    final rows = await query.get();

    final Map<String, DriftMemory> memoriesMap = {};

    for (final row in rows) {
      final memory = row.readTable(_db.memoryEntity);
      final asset = row.readTable(_db.remoteAssetEntity);

      final existingMemory = memoriesMap[memory.id];
      if (existingMemory != null) {
        existingMemory.assets.add(asset.toDto());
      } else {
        final assets = [asset.toDto()];
        memoriesMap[memory.id] = memory.toDto().copyWith(assets: assets);
      }
    }

    return memoriesMap.values.toList();
  }
}

extension on MemoryEntityData {
  DriftMemory toDto() {
    return DriftMemory(
      id: id,
      createdAt: createdAt,
      updatedAt: updatedAt,
      deletedAt: deletedAt,
      ownerId: ownerId,
      type: type,
      data: MemoryData.fromJson(data),
      isSaved: isSaved,
      memoryAt: memoryAt,
      seenAt: seenAt,
      showAt: showAt,
      hideAt: hideAt,
      assets: [],
    );
  }
}

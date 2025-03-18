import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/device_asset_hash.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/device_asset_hash.interface.dart';
import 'package:immich_mobile/domain/models/device_asset_hash.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class DeviceAssetToHashRepository
    with LogMixin
    implements IDeviceAssetToHashRepository {
  final DriftDatabaseRepository _db;

  const DeviceAssetToHashRepository({required DriftDatabaseRepository db})
      : _db = db;

  @override
  Future<bool> upsertAll(Iterable<DeviceAssetToHash> assetHash) async {
    try {
      await _db.batch((batch) => batch.insertAllOnConflictUpdate(
            _db.deviceAssetToHash,
            assetHash.map(_toEntity),
          ));

      return true;
    } catch (e, s) {
      log.e("Cannot add device assets to hash entry", e, s);
      return false;
    }
  }

  @override
  Future<List<DeviceAssetToHash>> getForIds(Iterable<String> localIds) async {
    final query = _db.deviceAssetToHash.select()
      ..where((f) => f.localId.isIn(localIds));
    return await query.map(_toModel).get();
  }

  @override
  Future<void> deleteIds(Iterable<int> ids) async {
    await _db.deviceAssetToHash.deleteWhere((row) => row.id.isIn(ids));
  }
}

DeviceAssetToHashCompanion _toEntity(DeviceAssetToHash asset) {
  return DeviceAssetToHashCompanion.insert(
    id: Value.absentIfNull(asset.id),
    localId: asset.localId,
    hash: asset.hash,
    modifiedTime: Value(asset.modifiedTime),
  );
}

DeviceAssetToHash _toModel(DeviceAssetToHashData asset) {
  return DeviceAssetToHash(
    id: asset.id,
    localId: asset.localId,
    hash: asset.hash,
    modifiedTime: asset.modifiedTime,
  );
}

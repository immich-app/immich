import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/asset.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class AssetDriftRepository with LogMixin implements IAssetRepository {
  final DriftDatabaseRepository _db;

  const AssetDriftRepository(this._db);

  @override
  Future<bool> upsertAll(Iterable<Asset> assets) async {
    try {
      await _db.batch((batch) => batch.insertAllOnConflictUpdate(
            _db.asset,
            assets.map(_toEntity),
          ));

      return true;
    } catch (e, s) {
      log.e("Cannot insert remote assets into table", e, s);
      return false;
    }
  }

  @override
  Future<bool> deleteAll() async {
    try {
      await _db.asset.deleteAll();
      return true;
    } catch (e, s) {
      log.e("Cannot clear remote assets", e, s);
      return false;
    }
  }

  @override
  Future<List<Asset>> getAll({int? offset, int? limit}) async {
    final query = _db.asset.select()
      ..orderBy([(asset) => OrderingTerm.desc(asset.createdTime)]);

    if (limit != null) {
      query.limit(limit, offset: offset);
    }

    return (await query.get()).map(_toModel).toList();
  }

  @override
  Future<List<Asset>> getForLocalIds(List<String> localIds) async {
    final query = _db.asset.select()
      ..where((row) => row.localId.isIn(localIds))
      ..orderBy([(asset) => OrderingTerm.asc(asset.localId)]);

    return (await query.get()).map(_toModel).toList();
  }

  @override
  Future<List<Asset>> getForRemoteIds(List<String> remoteIds) async {
    final query = _db.asset.select()
      ..where((row) => row.remoteId.isIn(remoteIds))
      ..orderBy([(asset) => OrderingTerm.asc(asset.remoteId)]);

    return (await query.get()).map(_toModel).toList();
  }

  @override
  FutureOr<void> deleteIds(List<int> ids) async {
    await _db.asset.deleteWhere((row) => row.id.isIn(ids));
  }
}

AssetCompanion _toEntity(Asset asset) {
  return AssetCompanion.insert(
    localId: Value(asset.localId),
    remoteId: Value(asset.remoteId),
    name: asset.name,
    hash: asset.hash,
    height: Value(asset.height),
    width: Value(asset.width),
    type: asset.type,
    createdTime: asset.createdTime,
    duration: Value(asset.duration),
    modifiedTime: Value(asset.modifiedTime),
    livePhotoVideoId: Value(asset.livePhotoVideoId),
  );
}

Asset _toModel(AssetData asset) {
  return Asset(
    id: asset.id,
    localId: asset.localId,
    remoteId: asset.remoteId,
    name: asset.name,
    type: asset.type,
    hash: asset.hash,
    createdTime: asset.createdTime,
    modifiedTime: asset.modifiedTime,
    height: asset.height,
    width: asset.width,
    livePhotoVideoId: asset.livePhotoVideoId,
    duration: asset.duration,
  );
}

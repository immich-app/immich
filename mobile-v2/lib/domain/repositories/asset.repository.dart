import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/asset.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/domain/utils/drift_model_converters.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class AssetRepository with LogMixin implements IAssetRepository {
  final DriftDatabaseRepository _db;

  const AssetRepository({required DriftDatabaseRepository db}) : _db = db;

  @override
  Future<bool> upsertAll(Iterable<Asset> assets) async {
    try {
      await _db.batch((batch) {
        final rows = assets.map(_toEntity);
        for (final row in rows) {
          batch.insert(
            _db.asset,
            row,
            onConflict: DoUpdate((_) => row, target: [_db.asset.hash]),
          );
        }
      });

      return true;
    } catch (e, s) {
      log.e("Cannot insert assets into table", e, s);
      return false;
    }
  }

  @override
  Future<bool> deleteAll() async {
    try {
      await _db.asset.deleteAll();
      return true;
    } catch (e, s) {
      log.e("Cannot clear assets", e, s);
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

    return (await query.map(DriftModelConverters.toAssetModel).get()).toList();
  }

  @override
  Future<List<Asset>> getForLocalIds(Iterable<String> localIds) async {
    final query = _db.asset.select()
      ..where((row) => row.localId.isIn(localIds))
      ..orderBy([(asset) => OrderingTerm.asc(asset.hash)]);

    return (await query.get()).map(DriftModelConverters.toAssetModel).toList();
  }

  @override
  Future<List<Asset>> getForRemoteIds(Iterable<String> remoteIds) async {
    final query = _db.asset.select()
      ..where((row) => row.remoteId.isIn(remoteIds))
      ..orderBy([(asset) => OrderingTerm.asc(asset.hash)]);

    return (await query.get()).map(DriftModelConverters.toAssetModel).toList();
  }

  @override
  Future<List<Asset>> getForHashes(Iterable<String> hashes) async {
    final query = _db.asset.select()
      ..where((row) => row.hash.isIn(hashes))
      ..orderBy([(asset) => OrderingTerm.asc(asset.hash)]);

    return (await query.get()).map(DriftModelConverters.toAssetModel).toList();
  }

  @override
  Future<void> deleteIds(Iterable<int> ids) async {
    await _db.asset.deleteWhere((row) => row.id.isIn(ids));
  }

  @override
  Future<bool> upsert(Asset asset) async {
    final row = _toEntity(asset);
    await _db.asset.insertOne(
      row,
      onConflict: DoUpdate((_) => row, target: [_db.asset.hash]),
    );
    return true;
  }
}

AssetCompanion _toEntity(Asset asset) {
  return AssetCompanion.insert(
    id: Value.absentIfNull(asset.id),
    name: asset.name,
    hash: asset.hash,
    height: Value(asset.height),
    width: Value(asset.width),
    type: asset.type,
    createdTime: asset.createdTime.toUtc(),
    modifiedTime: Value(asset.modifiedTime.toUtc()),
    duration: Value(asset.duration),
    localId: Value(asset.localId),
    remoteId: Value(asset.remoteId),
    livePhotoVideoId: Value(asset.livePhotoVideoId),
  );
}

import 'package:immich_mobile/domain/entities/asset_isar.entity.dart' as entity;
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:isar/isar.dart';

class AssetIsarRepository implements IAssetRepository {
  final Isar db;

  const AssetIsarRepository({required this.db});

  @override
  Future<bool> deleteAll() async {
    await db.writeTxn(() async {
      await db.assets.clear();
    });
    return true;
  }

  @override
  Future<void> deleteIds(Iterable<int> ids) async {
    await db.writeTxn(() async {
      await db.assets.deleteAll(ids.toList());
    });
  }

  @override
  Future<List<Asset>> getAll({int? offset, int? limit}) async {
    return await db.assets
        .where()
        .offset(offset ?? 0)
        .limit(limit ?? 100)
        .findAll()
        .then((value) => value.map(_toModel).toList());
  }

  @override
  Future<List<Asset>> getForHashes(Iterable<String> hashes) async {
    return await db.assets
        .where()
        .filter()
        .anyOf(hashes, (asset, hash) => asset.hashEqualTo(hash))
        .findAll()
        .then((value) => value.map(_toModel).toList());
  }

  @override
  Future<List<Asset>> getForLocalIds(Iterable<String> localIds) async {
    return await db.assets
        .where()
        .filter()
        .anyOf(localIds, (asset, localId) => asset.localIdEqualTo(localId))
        .findAll()
        .then((value) => value.map(_toModel).toList());
  }

  @override
  Future<List<Asset>> getForRemoteIds(Iterable<String> remoteIds) async {
    return await db.assets
        .where()
        .filter()
        .anyOf(remoteIds, (asset, remoteId) => asset.remoteIdEqualTo(remoteId))
        .findAll()
        .then((value) => value.map(_toModel).toList());
  }

  @override
  Future<bool> upsertAll(Iterable<Asset> assets) async {
    await db.writeTxn(() async {
      await db.assets.putAll(assets.toEntity());
    });
    return true;
  }

  @override
  Future<bool> upsert(Asset assets) async {
    await db.writeTxn(() async {
      await db.assets.put(assets.toEntity());
    });
    return true;
  }
}

Asset _toModel(entity.Asset entity) {
  return Asset(
    id: entity.id,
    name: entity.name,
    hash: entity.hash,
    height: entity.height,
    width: entity.width,
    type: entity.type,
    createdTime: entity.createdTime,
    modifiedTime: entity.modifiedTime,
    duration: entity.duration,
    localId: entity.localId,
    remoteId: entity.remoteId,
    livePhotoVideoId: entity.livePhotoVideoId,
  );
}

extension on Asset {
  entity.Asset toEntity() {
    return entity.Asset(
      id: id,
      name: name,
      hash: hash,
      height: height,
      width: width,
      type: type,
      createdTime: createdTime,
      modifiedTime: modifiedTime,
      duration: duration,
      localId: localId,
      remoteId: remoteId,
      livePhotoVideoId: livePhotoVideoId,
    );
  }
}

extension on Iterable<Asset> {
  List<entity.Asset> toEntity() {
    return map((asset) => entity.Asset(
          id: asset.id,
          name: asset.name,
          hash: asset.hash,
          height: asset.height,
          width: asset.width,
          type: asset.type,
          createdTime: asset.createdTime,
          modifiedTime: asset.modifiedTime,
          duration: asset.duration,
          localId: asset.localId,
          remoteId: asset.remoteId,
          livePhotoVideoId: asset.livePhotoVideoId,
        )).toList();
  }
}

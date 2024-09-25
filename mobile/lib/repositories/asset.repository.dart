import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/android_device_asset.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/device_asset.entity.dart';
import 'package:immich_mobile/entities/ios_device_asset.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:isar/isar.dart';

final assetRepositoryProvider =
    Provider((ref) => AssetRepository(ref.watch(dbProvider)));

class AssetRepository implements IAssetRepository {
  final Isar _db;

  AssetRepository(
    this._db,
  );

  @override
  Future<List<Asset>> getByAlbum(Album album, {User? notOwnedBy}) {
    var query = album.assets.filter();
    if (notOwnedBy != null) {
      query = query.not().ownerIdEqualTo(notOwnedBy.isarId);
    }
    return query.findAll();
  }

  @override
  Future<void> deleteById(List<int> ids) =>
      _db.writeTxn(() => _db.assets.deleteAll(ids));

  @override
  Future<Asset?> getByRemoteId(String id) => _db.assets.getByRemoteId(id);

  @override
  Future<List<Asset>> getAllByRemoteId(Iterable<String> ids) =>
      _db.assets.getAllByRemoteId(ids);

  @override
  Future<List<Asset>> getAll({
    required int ownerId,
    bool? remote,
    int limit = 100,
  }) {
    if (remote == null) {
      return _db.assets
          .where()
          .ownerIdEqualToAnyChecksum(ownerId)
          .limit(limit)
          .findAll();
    }
    final QueryBuilder<Asset, Asset, QAfterFilterCondition> query;
    if (remote) {
      query = _db.assets
          .where()
          .localIdIsNull()
          .filter()
          .remoteIdIsNotNull()
          .ownerIdEqualTo(ownerId);
    } else {
      query = _db.assets
          .where()
          .remoteIdIsNull()
          .filter()
          .localIdIsNotNull()
          .ownerIdEqualTo(ownerId);
    }

    return query.limit(limit).findAll();
  }

  @override
  Future<List<Asset>> updateAll(List<Asset> assets) async {
    await _db.writeTxn(() => _db.assets.putAll(assets));
    return assets;
  }

  @override
  Future<List<Asset>> getMatches({
    required List<Asset> assets,
    required int ownerId,
    bool? remote,
    int limit = 100,
  }) {
    final QueryBuilder<Asset, Asset, QAfterFilterCondition> query;
    if (remote == null) {
      query = _db.assets.filter().remoteIdIsNotNull().or().localIdIsNotNull();
    } else if (remote) {
      query = _db.assets.where().localIdIsNull().filter().remoteIdIsNotNull();
    } else {
      query = _db.assets.where().remoteIdIsNull().filter().localIdIsNotNull();
    }
    return _getMatchesImpl(query, ownerId, assets, limit);
  }

  @override
  Future<List<DeviceAsset?>> getDeviceAssetsById(List<Object> ids) =>
      Platform.isAndroid
          ? _db.androidDeviceAssets.getAll(ids.cast())
          : _db.iOSDeviceAssets.getAllById(ids.cast());

  @override
  Future<void> upsertDeviceAssets(List<DeviceAsset> deviceAssets) =>
      _db.writeTxn(
        () => Platform.isAndroid
            ? _db.androidDeviceAssets.putAll(deviceAssets.cast())
            : _db.iOSDeviceAssets.putAll(deviceAssets.cast()),
      );
}

Future<List<Asset>> _getMatchesImpl(
  QueryBuilder<Asset, Asset, QAfterFilterCondition> query,
  int ownerId,
  List<Asset> assets,
  int limit,
) =>
    query
        .ownerIdEqualTo(ownerId)
        .anyOf(
          assets,
          (q, Asset a) => q
              .fileNameEqualTo(a.fileName)
              .and()
              .durationInSecondsEqualTo(a.durationInSeconds)
              .and()
              .fileCreatedAtBetween(
                a.fileCreatedAt.subtract(const Duration(hours: 12)),
                a.fileCreatedAt.add(const Duration(hours: 12)),
              )
              .and()
              .not()
              .checksumEqualTo(a.checksum),
        )
        .sortByFileName()
        .thenByFileCreatedAt()
        .thenByFileModifiedAt()
        .limit(limit)
        .findAll();

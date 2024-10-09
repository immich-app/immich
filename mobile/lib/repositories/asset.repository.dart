import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/android_device_asset.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/device_asset.entity.dart';
import 'package:immich_mobile/entities/duplicated_asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/entities/ios_device_asset.entity.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:isar/isar.dart';

final assetRepositoryProvider =
    Provider((ref) => AssetRepository(ref.watch(dbProvider)));

class AssetRepository extends DatabaseRepository implements IAssetRepository {
  AssetRepository(super.db);

  @override
  Future<List<Asset>> getByAlbum(
    Album album, {
    Iterable<int> notOwnedBy = const [],
    int? ownerId,
    AssetState? state,
    AssetSort? sortBy,
  }) {
    var query = album.assets.filter();
    if (notOwnedBy.length == 1) {
      query = query.not().ownerIdEqualTo(notOwnedBy.first);
    } else if (notOwnedBy.isNotEmpty) {
      query =
          query.not().anyOf(notOwnedBy, (q, int id) => q.ownerIdEqualTo(id));
    }
    if (ownerId != null) {
      query = query.ownerIdEqualTo(ownerId);
    }

    switch (state) {
      case null:
        break;
      case AssetState.local:
        query = query.remoteIdIsNull();
      case AssetState.remote:
        query = query.localIdIsNull();
      case AssetState.merged:
        query = query.localIdIsNotNull().remoteIdIsNotNull();
    }

    final QueryBuilder<Asset, Asset, QAfterSortBy> sortedQuery;

    switch (sortBy) {
      case null:
        sortedQuery = query.noOp();
      case AssetSort.checksum:
        sortedQuery = query.sortByChecksum();
      case AssetSort.ownerIdChecksum:
        sortedQuery = query.sortByOwnerId().thenByChecksum();
    }

    return sortedQuery.findAll();
  }

  @override
  Future<void> deleteById(List<int> ids) => txn(() async {
        await db.assets.deleteAll(ids);
        await db.exifInfos.deleteAll(ids);
      });

  @override
  Future<Asset?> getByRemoteId(String id) => db.assets.getByRemoteId(id);

  @override
  Future<List<Asset>> getAllByRemoteId(
    Iterable<String> ids, {
    AssetState? state,
  }) =>
      _getAllByRemoteIdImpl(ids, state).findAll();

  QueryBuilder<Asset, Asset, QAfterFilterCondition> _getAllByRemoteIdImpl(
    Iterable<String> ids,
    AssetState? state,
  ) {
    final query = db.assets.remote(ids).filter();
    switch (state) {
      case null:
        return query.noOp();
      case AssetState.local:
        return query.remoteIdIsNull();
      case AssetState.remote:
        return query.localIdIsNull();
      case AssetState.merged:
        return query.localIdIsNotEmpty().remoteIdIsNotNull();
    }
  }

  @override
  Future<List<Asset>> getAll({
    required int ownerId,
    AssetState? state,
    AssetSort? sortBy,
    int? limit,
  }) {
    final baseQuery = db.assets.where();
    final QueryBuilder<Asset, Asset, QAfterFilterCondition> filteredQuery;
    switch (state) {
      case null:
        filteredQuery = baseQuery.ownerIdEqualToAnyChecksum(ownerId).noOp();
      case AssetState.local:
        filteredQuery = baseQuery
            .remoteIdIsNull()
            .filter()
            .localIdIsNotNull()
            .ownerIdEqualTo(ownerId);
      case AssetState.remote:
        filteredQuery = baseQuery
            .localIdIsNull()
            .filter()
            .remoteIdIsNotNull()
            .ownerIdEqualTo(ownerId);
      case AssetState.merged:
        filteredQuery = baseQuery
            .ownerIdEqualToAnyChecksum(ownerId)
            .filter()
            .remoteIdIsNotNull()
            .localIdIsNotNull();
    }

    final QueryBuilder<Asset, Asset, QAfterSortBy> query;
    switch (sortBy) {
      case null:
        query = filteredQuery.noOp();
      case AssetSort.checksum:
        query = filteredQuery.sortByChecksum();
      case AssetSort.ownerIdChecksum:
        query = filteredQuery.sortByOwnerId().thenByChecksum();
    }

    return limit == null ? query.findAll() : query.limit(limit).findAll();
  }

  @override
  Future<List<Asset>> updateAll(List<Asset> assets) async {
    await txn(() => db.assets.putAll(assets));
    return assets;
  }

  @override
  Future<List<Asset>> getMatches({
    required List<Asset> assets,
    required int ownerId,
    AssetState? state,
    int limit = 100,
  }) {
    final baseQuery = db.assets.where();
    final QueryBuilder<Asset, Asset, QAfterFilterCondition> query;
    switch (state) {
      case null:
        query = baseQuery.noOp();
      case AssetState.local:
        query = baseQuery.remoteIdIsNull().filter().localIdIsNotNull();
      case AssetState.remote:
        query = baseQuery.localIdIsNull().filter().remoteIdIsNotNull();
      case AssetState.merged:
        query = baseQuery.localIdIsNotNull().filter().remoteIdIsNotNull();
    }
    return _getMatchesImpl(query, ownerId, assets, limit);
  }

  @override
  Future<List<DeviceAsset?>> getDeviceAssetsById(List<Object> ids) =>
      Platform.isAndroid
          ? db.androidDeviceAssets.getAll(ids.cast())
          : db.iOSDeviceAssets.getAllById(ids.cast());

  @override
  Future<void> upsertDeviceAssets(List<DeviceAsset> deviceAssets) => txn(
        () => Platform.isAndroid
            ? db.androidDeviceAssets.putAll(deviceAssets.cast())
            : db.iOSDeviceAssets.putAll(deviceAssets.cast()),
      );

  @override
  Future<Asset> update(Asset asset) async {
    await txn(() => asset.put(db));
    return asset;
  }

  @override
  Future<void> upsertDuplicatedAssets(Iterable<String> duplicatedAssets) => txn(
        () => db.duplicatedAssets
            .putAll(duplicatedAssets.map(DuplicatedAsset.new).toList()),
      );

  @override
  Future<List<String>> getAllDuplicatedAssetIds() =>
      db.duplicatedAssets.where().idProperty().findAll();

  @override
  Future<Asset?> getByOwnerIdChecksum(int ownerId, String checksum) =>
      db.assets.getByOwnerIdChecksum(ownerId, checksum);

  @override
  Future<List<Asset?>> getAllByOwnerIdChecksum(
    List<int> ids,
    List<String> checksums,
  ) =>
      db.assets.getAllByOwnerIdChecksum(ids, checksums);

  @override
  Future<List<Asset>> getAllLocal() =>
      db.assets.where().localIdIsNotNull().findAll();

  @override
  Future<void> deleteAllByRemoteId(List<String> ids, {AssetState? state}) =>
      txn(() => _getAllByRemoteIdImpl(ids, state).deleteAll());
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

import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/android_device_asset.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/device_asset.entity.dart';
import 'package:immich_mobile/entities/duplicated_asset.entity.dart';
import 'package:immich_mobile/entities/ios_device_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
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

    if (state != null) {
      query = switch (state) {
        AssetState.local => query.remoteIdIsNull(),
        AssetState.remote => query.localIdIsNull(),
        AssetState.merged => query.localIdIsNotNull().remoteIdIsNotNull(),
      };
    }

    final QueryBuilder<Asset, Asset, QAfterSortBy> sortedQuery =
        switch (sortBy) {
      null => query.noOp(),
      AssetSort.checksum => query.sortByChecksum(),
      AssetSort.ownerIdChecksum => query.sortByOwnerId().thenByChecksum(),
    };

    return sortedQuery.findAll();
  }

  @override
  Future<void> deleteByIds(List<int> ids) => txn(() async {
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
    return switch (state) {
      null => query.noOp(),
      AssetState.local => query.remoteIdIsNull(),
      AssetState.remote => query.localIdIsNull(),
      AssetState.merged => query.localIdIsNotEmpty().remoteIdIsNotNull(),
    };
  }

  @override
  Future<List<Asset>> getAll({
    required int ownerId,
    AssetState? state,
    AssetSort? sortBy,
    int? limit,
  }) {
    final baseQuery = db.assets.where();
    final QueryBuilder<Asset, Asset, QAfterFilterCondition> filteredQuery =
        switch (state) {
      null => baseQuery.ownerIdEqualToAnyChecksum(ownerId).noOp(),
      AssetState.local => baseQuery
          .remoteIdIsNull()
          .filter()
          .localIdIsNotNull()
          .ownerIdEqualTo(ownerId),
      AssetState.remote => baseQuery
          .localIdIsNull()
          .filter()
          .remoteIdIsNotNull()
          .ownerIdEqualTo(ownerId),
      AssetState.merged => baseQuery
          .ownerIdEqualToAnyChecksum(ownerId)
          .filter()
          .remoteIdIsNotNull()
          .localIdIsNotNull(),
    };

    final QueryBuilder<Asset, Asset, QAfterSortBy> query = switch (sortBy) {
      null => filteredQuery.noOp(),
      AssetSort.checksum => filteredQuery.sortByChecksum(),
      AssetSort.ownerIdChecksum =>
        filteredQuery.sortByOwnerId().thenByChecksum(),
    };

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
    final QueryBuilder<Asset, Asset, QAfterFilterCondition> query =
        switch (state) {
      null => baseQuery.noOp(),
      AssetState.local =>
        baseQuery.remoteIdIsNull().filter().localIdIsNotNull(),
      AssetState.remote =>
        baseQuery.localIdIsNull().filter().remoteIdIsNotNull(),
      AssetState.merged =>
        baseQuery.localIdIsNotNull().filter().remoteIdIsNotNull(),
    };
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

  @override
  Future<List<Asset>> getStackAssets(String stackId) {
    return db.assets
        .filter()
        .isArchivedEqualTo(false)
        .isTrashedEqualTo(false)
        .stackIdEqualTo(stackId)
        // orders primary asset first as its ID is null
        .sortByStackPrimaryAssetId()
        .thenByFileCreatedAtDesc()
        .findAll();
  }

  @override
  Future<void> clearTable() async {
    await txn(() async {
      await db.assets.clear();
    });
  }

  @override
  Stream<Asset?> watchAsset(int id, {bool fireImmediately = false}) {
    return db.assets.watchObject(id, fireImmediately: fireImmediately);
  }

  @override
  Future<List<Asset>> getTrashAssets(int userId) {
    return db.assets
        .where()
        .remoteIdIsNotNull()
        .filter()
        .ownerIdEqualTo(userId)
        .isTrashedEqualTo(true)
        .findAll();
  }

  @override
  Future<List<Asset>> getRecentlyAddedAssets(int userId) {
    return db.assets
        .where()
        .ownerIdEqualToAnyChecksum(userId)
        .sortByFileCreatedAtDesc()
        .findAll();
  }

  @override
  Future<List<Asset>> getMotionAssets(int userId) {
    return db.assets
        .where()
        .ownerIdEqualToAnyChecksum(userId)
        .filter()
        .livePhotoVideoIdIsNotNull()
        .findAll();
  }
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

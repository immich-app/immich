import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/duplicated_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';

enum AssetSort { checksum, ownerIdChecksum }

final assetRepositoryProvider =
    Provider((ref) => AssetRepository(ref.watch(dbProvider)));

class AssetRepository extends DatabaseRepository {
  AssetRepository(super.db);

  Future<List<Asset>> getByAlbum(
    Album album, {
    Iterable<String> notOwnedBy = const [],
    String? ownerId,
    AssetState? state,
    AssetSort? sortBy,
  }) {
    var query = album.assets.filter();
    final isarUserIds = notOwnedBy.map(fastHash).toList();
    if (notOwnedBy.length == 1) {
      query = query.not().ownerIdEqualTo(isarUserIds.first);
    } else if (notOwnedBy.isNotEmpty) {
      query =
          query.not().anyOf(isarUserIds, (q, int id) => q.ownerIdEqualTo(id));
    }
    if (ownerId != null) {
      query = query.ownerIdEqualTo(fastHash(ownerId));
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

  Future<void> deleteByIds(List<int> ids) => txn(() async {
        await db.assets.deleteAll(ids);
        await db.exifInfos.deleteAll(ids);
      });

  Future<Asset?> getByRemoteId(String id) => db.assets.getByRemoteId(id);

  Future<List<Asset>> getAllByRemoteId(
    Iterable<String> ids, {
    AssetState? state,
  }) async {
    if (ids.isEmpty) {
      return [];
    }

    return _getAllByRemoteIdImpl(ids, state).findAll();
  }

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

  Future<List<Asset>> getAll({
    required String ownerId,
    AssetState? state,
    AssetSort? sortBy,
    int? limit,
  }) {
    final baseQuery = db.assets.where();
    final isarUserIds = fastHash(ownerId);
    final QueryBuilder<Asset, Asset, QAfterFilterCondition> filteredQuery =
        switch (state) {
      null => baseQuery.ownerIdEqualToAnyChecksum(isarUserIds).noOp(),
      AssetState.local => baseQuery
          .remoteIdIsNull()
          .filter()
          .localIdIsNotNull()
          .ownerIdEqualTo(isarUserIds),
      AssetState.remote => baseQuery
          .localIdIsNull()
          .filter()
          .remoteIdIsNotNull()
          .ownerIdEqualTo(isarUserIds),
      AssetState.merged => baseQuery
          .ownerIdEqualToAnyChecksum(isarUserIds)
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

  Future<List<Asset>> updateAll(List<Asset> assets) async {
    await txn(() => db.assets.putAll(assets));
    return assets;
  }

  Future<List<Asset>> getMatches({
    required List<Asset> assets,
    required String ownerId,
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
    return _getMatchesImpl(query, fastHash(ownerId), assets, limit);
  }

  Future<Asset> update(Asset asset) async {
    await txn(() => asset.put(db));
    return asset;
  }

  Future<void> upsertDuplicatedAssets(Iterable<String> duplicatedAssets) => txn(
        () => db.duplicatedAssets
            .putAll(duplicatedAssets.map(DuplicatedAsset.new).toList()),
      );

  Future<List<String>> getAllDuplicatedAssetIds() =>
      db.duplicatedAssets.where().idProperty().findAll();

  Future<Asset?> getByOwnerIdChecksum(int ownerId, String checksum) =>
      db.assets.getByOwnerIdChecksum(ownerId, checksum);

  Future<List<Asset?>> getAllByOwnerIdChecksum(
    List<int> ownerIds,
    List<String> checksums,
  ) =>
      db.assets.getAllByOwnerIdChecksum(ownerIds, checksums);

  Future<List<Asset>> getAllLocal() =>
      db.assets.where().localIdIsNotNull().findAll();

  Future<void> deleteAllByRemoteId(List<String> ids, {AssetState? state}) =>
      txn(() => _getAllByRemoteIdImpl(ids, state).deleteAll());

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

  Future<void> clearTable() async {
    await txn(() async {
      await db.assets.clear();
    });
  }

  Stream<Asset?> watchAsset(int id, {bool fireImmediately = false}) {
    return db.assets.watchObject(id, fireImmediately: fireImmediately);
  }

  Future<List<Asset>> getTrashAssets(String userId) {
    return db.assets
        .where()
        .remoteIdIsNotNull()
        .filter()
        .ownerIdEqualTo(fastHash(userId))
        .isTrashedEqualTo(true)
        .findAll();
  }

  Future<List<Asset>> getRecentlyTakenAssets(String userId) {
    return db.assets
        .where()
        .ownerIdEqualToAnyChecksum(fastHash(userId))
        .filter()
        .visibilityEqualTo(AssetVisibilityEnum.timeline)
        .sortByFileCreatedAtDesc()
        .findAll();
  }

  Future<List<Asset>> getMotionAssets(String userId) {
    return db.assets
        .where()
        .ownerIdEqualToAnyChecksum(fastHash(userId))
        .filter()
        .visibilityEqualTo(AssetVisibilityEnum.timeline)
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

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart'
    as entity;
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';

enum AlbumSort { remoteId, localId }

final albumRepositoryProvider =
    Provider((ref) => AlbumRepository(ref.watch(dbProvider)));

class AlbumRepository extends DatabaseRepository {
  AlbumRepository(super.db);

  Future<int> count({bool? local}) {
    final baseQuery = db.albums.where();
    final QueryBuilder<Album, Album, QAfterWhereClause> query = switch (local) {
      null => baseQuery.noOp(),
      true => baseQuery.localIdIsNotNull(),
      false => baseQuery.remoteIdIsNotNull(),
    };
    return query.count();
  }

  Future<Album> create(Album album) => txn(() => db.albums.store(album));

  Future<Album?> getByName(
    String name, {
    bool? shared,
    bool? remote,
    bool? owner,
  }) {
    var query = db.albums.filter().nameEqualTo(name);
    if (shared != null) {
      query = query.sharedEqualTo(shared);
    }
    final isarUserId = fastHash(Store.get(StoreKey.currentUser).id);
    if (owner == true) {
      query = query.owner((q) => q.isarIdEqualTo(isarUserId));
    } else if (owner == false) {
      query = query.owner((q) => q.not().isarIdEqualTo(isarUserId));
    }
    if (remote == true) {
      query = query.localIdIsNull();
    } else if (remote == false) {
      query = query.remoteIdIsNull();
    }
    return query.findFirst();
  }

  Future<Album> update(Album album) => txn(() => db.albums.store(album));

  Future<void> delete(int albumId) => txn(() => db.albums.delete(albumId));

  Future<List<Album>> getAll({
    bool? shared,
    bool? remote,
    int? ownerId,
    AlbumSort? sortBy,
  }) {
    final baseQuery = db.albums.where();
    final QueryBuilder<Album, Album, QAfterWhereClause> afterWhere;
    if (remote == null) {
      afterWhere = baseQuery.noOp();
    } else if (remote) {
      afterWhere = baseQuery.remoteIdIsNotNull();
    } else {
      afterWhere = baseQuery.localIdIsNotNull();
    }
    QueryBuilder<Album, Album, QAfterFilterCondition> filterQuery =
        afterWhere.filter().noOp();
    if (shared != null) {
      filterQuery = filterQuery.sharedEqualTo(true);
    }
    if (ownerId != null) {
      filterQuery = filterQuery.owner((q) => q.isarIdEqualTo(ownerId));
    }
    final QueryBuilder<Album, Album, QAfterSortBy> query = switch (sortBy) {
      null => filterQuery.noOp(),
      AlbumSort.remoteId => filterQuery.sortByRemoteId(),
      AlbumSort.localId => filterQuery.sortByLocalId(),
    };
    return query.findAll();
  }

  Future<Album?> get(int id) => db.albums.get(id);

  Future<void> removeUsers(Album album, List<UserDto> users) => txn(
        () => album.sharedUsers.update(unlink: users.map(entity.User.fromDto)),
      );

  Future<void> addAssets(Album album, List<Asset> assets) =>
      txn(() => album.assets.update(link: assets));

  Future<void> removeAssets(Album album, List<Asset> assets) =>
      txn(() => album.assets.update(unlink: assets));

  Future<Album> recalculateMetadata(Album album) async {
    album.startDate = await album.assets.filter().fileCreatedAtProperty().min();
    album.endDate = await album.assets.filter().fileCreatedAtProperty().max();
    album.lastModifiedAssetTimestamp =
        await album.assets.filter().updatedAtProperty().max();
    return album;
  }

  Future<void> addUsers(Album album, List<UserDto> users) =>
      txn(() => album.sharedUsers.update(link: users.map(entity.User.fromDto)));

  Future<void> deleteAllLocal() =>
      txn(() => db.albums.where().localIdIsNotNull().deleteAll());

  Future<List<Album>> search(
    String searchTerm,
    QuickFilterMode filterMode,
  ) async {
    var query = db.albums
        .filter()
        .nameContains(searchTerm, caseSensitive: false)
        .remoteIdIsNotNull();
    final isarUserId = fastHash(Store.get(StoreKey.currentUser).id);

    switch (filterMode) {
      case QuickFilterMode.sharedWithMe:
        query = query.owner((q) => q.not().isarIdEqualTo(isarUserId));
      case QuickFilterMode.myAlbums:
        query = query.owner((q) => q.isarIdEqualTo(isarUserId));
      case QuickFilterMode.all:
        break;
    }

    return await query.findAll();
  }

  Future<void> clearTable() async {
    await txn(() async {
      await db.albums.clear();
    });
  }

  Stream<List<Album>> watchRemoteAlbums() {
    return db.albums.where().remoteIdIsNotNull().watch();
  }

  Stream<List<Album>> watchLocalAlbums() {
    return db.albums.where().localIdIsNotNull().watch();
  }

  Stream<Album?> watchAlbum(int id) {
    return db.albums.watchObject(id, fireImmediately: true);
  }
}

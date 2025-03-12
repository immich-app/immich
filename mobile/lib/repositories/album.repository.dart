import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart'
    as entity;
import 'package:immich_mobile/interfaces/album.interface.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:isar/isar.dart';

final albumRepositoryProvider =
    Provider((ref) => AlbumRepository(ref.watch(dbProvider)));

class AlbumRepository extends DatabaseRepository implements IAlbumRepository {
  AlbumRepository(super.db);

  @override
  Future<int> count({bool? local}) {
    final baseQuery = db.albums.where();
    final QueryBuilder<Album, Album, QAfterWhereClause> query = switch (local) {
      null => baseQuery.noOp(),
      true => baseQuery.localIdIsNotNull(),
      false => baseQuery.remoteIdIsNotNull(),
    };
    return query.count();
  }

  @override
  Future<Album> create(Album album) => txn(() => db.albums.store(album));

  @override
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
    if (owner == true) {
      query = query.owner(
        (q) => q.isarIdEqualTo(Store.get(StoreKey.currentUser).id),
      );
    } else if (owner == false) {
      query = query.owner(
        (q) => q.not().isarIdEqualTo(Store.get(StoreKey.currentUser).id),
      );
    }
    if (remote == true) {
      query = query.localIdIsNull();
    } else if (remote == false) {
      query = query.remoteIdIsNull();
    }
    return query.findFirst();
  }

  @override
  Future<Album> update(Album album) => txn(() => db.albums.store(album));

  @override
  Future<void> delete(int albumId) => txn(() => db.albums.delete(albumId));

  @override
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

  @override
  Future<Album?> get(int id) => db.albums.get(id);

  @override
  Future<void> removeUsers(Album album, List<UserDto> users) => txn(
        () => album.sharedUsers.update(unlink: users.map(entity.User.fromDto)),
      );

  @override
  Future<void> addAssets(Album album, List<Asset> assets) =>
      txn(() => album.assets.update(link: assets));

  @override
  Future<void> removeAssets(Album album, List<Asset> assets) =>
      txn(() => album.assets.update(unlink: assets));

  @override
  Future<Album> recalculateMetadata(Album album) async {
    album.startDate = await album.assets.filter().fileCreatedAtProperty().min();
    album.endDate = await album.assets.filter().fileCreatedAtProperty().max();
    album.lastModifiedAssetTimestamp =
        await album.assets.filter().updatedAtProperty().max();
    return album;
  }

  @override
  Future<void> addUsers(Album album, List<UserDto> users) =>
      txn(() => album.sharedUsers.update(link: users.map(entity.User.fromDto)));

  @override
  Future<void> deleteAllLocal() =>
      txn(() => db.albums.where().localIdIsNotNull().deleteAll());

  @override
  Future<List<Album>> search(
    String searchTerm,
    QuickFilterMode filterMode,
  ) async {
    var query = db.albums
        .filter()
        .nameContains(searchTerm, caseSensitive: false)
        .remoteIdIsNotNull();

    switch (filterMode) {
      case QuickFilterMode.sharedWithMe:
        query = query.owner(
          (q) => q.not().isarIdEqualTo(Store.get(StoreKey.currentUser).id),
        );
      case QuickFilterMode.myAlbums:
        query = query.owner(
          (q) => q.isarIdEqualTo(Store.get(StoreKey.currentUser).id),
        );
      case QuickFilterMode.all:
        break;
    }

    return await query.findAll();
  }

  @override
  Future<void> clearTable() async {
    await txn(() async {
      await db.albums.clear();
    });
  }

  @override
  Stream<List<Album>> watchRemoteAlbums() {
    return db.albums.where().remoteIdIsNotNull().watch();
  }

  @override
  Stream<List<Album>> watchLocalAlbums() {
    return db.albums.where().localIdIsNotNull().watch();
  }

  @override
  Stream<Album?> watchAlbum(int id) {
    return db.albums.watchObject(id, fireImmediately: true);
  }
}

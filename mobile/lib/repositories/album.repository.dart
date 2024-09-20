import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/album.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:isar/isar.dart';

final albumRepositoryProvider =
    Provider((ref) => AlbumRepository(ref.watch(dbProvider)));

class AlbumRepository implements IAlbumRepository {
  final Isar _db;

  AlbumRepository(
    this._db,
  );

  @override
  Future<int> count({bool? local}) {
    if (local == true) return _db.albums.where().localIdIsNotNull().count();
    if (local == false) return _db.albums.where().remoteIdIsNotNull().count();
    return _db.albums.count();
  }

  @override
  Future<Album> create(Album album) =>
      _db.writeTxn(() => _db.albums.store(album));

  @override
  Future<Album?> getByName(String name, {bool? shared, bool? remote}) {
    var query = _db.albums.filter().nameEqualTo(name);
    if (shared != null) {
      query = query.sharedEqualTo(shared);
    }
    if (remote == true) {
      query = query.localIdIsNull();
    } else if (remote == false) {
      query = query.remoteIdIsNull();
    }
    return query.findFirst();
  }

  @override
  Future<Album> update(Album album) =>
      _db.writeTxn(() => _db.albums.store(album));

  @override
  Future<void> delete(int albumId) =>
      _db.writeTxn(() => _db.albums.delete(albumId));

  @override
  Future<List<Album>> getAll({bool? shared}) {
    final baseQuery = _db.albums.filter();
    QueryBuilder<Album, Album, QAfterFilterCondition>? query;
    if (shared != null) {
      query = baseQuery.sharedEqualTo(true);
    }
    return query?.findAll() ?? _db.albums.where().findAll();
  }

  @override
  Future<Album?> getById(int id) => _db.albums.get(id);

  @override
  Future<void> removeUsers(Album album, List<User> users) =>
      _db.writeTxn(() => album.sharedUsers.update(unlink: users));

  @override
  Future<void> addAssets(Album album, List<Asset> assets) =>
      _db.writeTxn(() => album.assets.update(link: assets));

  @override
  Future<void> removeAssets(Album album, List<Asset> assets) =>
      _db.writeTxn(() => album.assets.update(unlink: assets));

  @override
  Future<Album> recalculateMetadata(Album album) async {
    album.startDate = await album.assets.filter().fileCreatedAtProperty().min();
    album.endDate = await album.assets.filter().fileCreatedAtProperty().max();
    album.lastModifiedAssetTimestamp =
        await album.assets.filter().updatedAtProperty().max();
    return album;
  }
}

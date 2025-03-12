import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/database.interface.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';

abstract interface class IAlbumRepository implements IDatabaseRepository {
  Future<Album> create(Album album);

  Future<Album?> get(int id);

  Future<Album?> getByName(
    String name, {
    bool? shared,
    bool? remote,
    bool? owner,
  });

  Future<List<Album>> getAll({
    bool? shared,
    bool? remote,
    int? ownerId,
    AlbumSort? sortBy,
  });

  Future<Album> update(Album album);

  Future<void> delete(int albumId);

  Future<void> deleteAllLocal();

  Future<int> count({bool? local});

  Future<void> addUsers(Album album, List<UserDto> users);

  Future<void> removeUsers(Album album, List<UserDto> users);

  Future<void> addAssets(Album album, List<Asset> assets);

  Future<void> removeAssets(Album album, List<Asset> assets);

  Future<Album> recalculateMetadata(Album album);

  Future<List<Album>> search(String searchTerm, QuickFilterMode filterMode);

  Stream<List<Album>> watchRemoteAlbums();

  Stream<List<Album>> watchLocalAlbums();

  Stream<Album?> watchAlbum(int id);

  Future<void> clearTable();
}

enum AlbumSort { remoteId, localId }

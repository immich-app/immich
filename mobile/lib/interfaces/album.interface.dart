import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/database.interface.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';

abstract interface class IAlbumRepository implements IDatabaseRepository {
  Future<Album> create(Album album);

  Future<Album?> get(int id);

  Future<Album?> getByName(
    String name, {
    bool? shared,
    bool? remote,
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

  Future<void> addUsers(Album album, List<User> users);

  Future<void> removeUsers(Album album, List<User> users);

  Future<void> addAssets(Album album, List<Asset> assets);

  Future<void> removeAssets(Album album, List<Asset> assets);

  Future<Album> recalculateMetadata(Album album);

  Future<List<Album>> search(String searchTerm, QuickFilterMode filterMode);
}

enum AlbumSort { remoteId, localId }

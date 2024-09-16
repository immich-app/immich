import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';

abstract interface class IAlbumRepository {
  Future<int> count({bool? local});
  Future<Album> create(Album album);
  Future<Album?> getById(int id);
  Future<Album?> getByName(
    String name, {
    bool? shared,
    bool? remote,
  });
  Future<Album> update(Album album);
  Future<void> delete(int albumId);
  Future<List<Album>> getAll({bool? shared});
  Future<void> removeUsers(Album album, List<User> users);
  Future<void> addAssets(Album album, List<Asset> assets);
  Future<void> removeAssets(Album album, List<Asset> assets);
  Future<Album> recalculateMetadata(Album album);
}

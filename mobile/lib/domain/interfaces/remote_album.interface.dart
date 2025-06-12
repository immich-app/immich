import 'package:immich_mobile/domain/models/album/base_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

abstract interface class IRemoteAlbumRepository {
  Future<List<Album>> getAll();

  Future<void> delete(String albumId);

  Future<void> upsert(
    String ownerId,
    Album remoteAlbum, {
    Iterable<String> toUpsert = const [],
    Iterable<String> toDelete = const [],
  });

  Future<void> updateAll(String ownerId, Iterable<Album> albums);

  Future<List<Asset>> getAssets(String albumId);
  Future<List<String>> getAssetIds(String albumId);
}

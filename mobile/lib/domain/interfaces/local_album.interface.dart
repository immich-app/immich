import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';

abstract interface class ILocalAlbumRepository implements IDatabaseRepository {
  Future<void> insert(LocalAlbum localAlbum, Iterable<LocalAsset> assets);

  Future<void> addAssets(String albumId, Iterable<LocalAsset> assets);

  Future<List<LocalAlbum>> getAll({SortLocalAlbumsBy? sortBy});

  Future<List<LocalAsset>> getAssetsForAlbum(String albumId);

  Future<void> update(LocalAlbum localAlbum);

  Future<void> delete(String albumId);

  Future<void> removeAssets(String albumId, Iterable<String> assetIds);
}

enum SortLocalAlbumsBy { id }

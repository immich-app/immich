import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/platform/messages.g.dart';

abstract interface class ILocalAlbumRepository implements IDatabaseRepository {
  Future<void> insert(LocalAlbum album, Iterable<LocalAsset> assets);

  Future<void> addAssets(String albumId, Iterable<LocalAsset> assets);

  Future<List<LocalAlbum>> getAll({SortLocalAlbumsBy? sortBy});

  Future<List<LocalAsset>> getAssetsForAlbum(String albumId);

  Future<List<String>> getAssetIdsForAlbum(String albumId);

  Future<void> update(LocalAlbum album);

  Future<void> updateAll(Iterable<LocalAlbum> albums);

  Future<void> handleSyncDelta(SyncDelta delta);

  Future<void> delete(String albumId);

  Future<void> removeMissing(String albumId, Iterable<String> assetIds);

  Future<void> removeAssets(String albumId, Iterable<String> assetIds);
}

enum SortLocalAlbumsBy { id }

import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';

abstract interface class ILocalAlbumRepository implements IDatabaseRepository {
  Future<List<LocalAlbum>> getAll({SortLocalAlbumsBy? sortBy});

  Future<List<LocalAsset>> getAssetsForAlbum(String albumId);

  Future<List<String>> getAssetIdsForAlbum(String albumId);

  Future<void> upsert(
    LocalAlbum album, {
    Iterable<LocalAsset> toUpsert = const [],
    Iterable<String> toDelete = const [],
  });

  Future<void> update(LocalAlbum album);
  Future<void> updateAll(Iterable<LocalAlbum> albums);

  Future<void> delete(String albumId);

  Future<void> processDelta({
    required List<LocalAsset> updates,
    required List<String> deletes,
    required Map<String, List<String>> assetAlbums,
  });

  Future<void> syncAlbumDeletes(
    String albumId,
    Iterable<String> assetIdsToKeep,
  );

  Future<List<LocalAsset>> getAssetsToHash(String albumId);
}

enum SortLocalAlbumsBy { id }

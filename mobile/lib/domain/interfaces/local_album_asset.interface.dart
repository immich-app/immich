import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart';

abstract interface class ILocalAlbumAssetRepository
    implements IDatabaseRepository {
  Future<List<LocalAsset>> getAssetsForAlbum(String albumId);

  Future<void> linkAssetsToAlbum(String albumId, Iterable<String> assetIds);

  Future<void> unlinkAssetsFromAlbum(String albumId, Iterable<String> assetIds);
}

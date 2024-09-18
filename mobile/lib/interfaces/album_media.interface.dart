import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

abstract interface class IAlbumMediaRepository {
  Future<List<Album>> getAll();

  Future<List<String>> getAssetIds(String albumId);

  Future<int> getAssetCount(String albumId);

  Future<List<Asset>> getAssets(
    String albumId, {
    int start = 0,
    int end = 0x7fffffffffffffff,
    DateTime? modifiedFrom,
    DateTime? modifiedUntil,
    bool orderByModificationDate = false,
  });

  Future<Album> get(String id);
}

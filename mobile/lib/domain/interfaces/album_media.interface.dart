import 'package:immich_mobile/domain/models/asset/asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';

abstract interface class IAlbumMediaRepository {
  Future<List<LocalAlbum>> getAll({
    bool withModifiedTime = false,
    bool withAssetCount = false,
    bool withAssetTitle = false,
  });

  Future<List<LocalAsset>> getAssetsForAlbum(
    String albumId, {
    bool withModifiedTime = false,
    bool withAssetTitle = true,
    DateTimeFilter? updateTimeCond,
  });

  Future<LocalAlbum> refresh(
    String albumId, {
    bool withModifiedTime = false,
    bool withAssetCount = false,
    bool withAssetTitle = false,
  });
}

class DateTimeFilter {
  final DateTime min;
  final DateTime max;

  const DateTimeFilter({required this.min, required this.max});
}

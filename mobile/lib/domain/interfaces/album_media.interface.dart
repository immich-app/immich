import 'package:immich_mobile/domain/models/asset/asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';

abstract interface class IAlbumMediaRepository {
  Future<List<LocalAlbum>> getAll();

  Future<List<LocalAsset>> getAssetsForAlbum(
    String albumId, {
    DateTimeFilter? updateTimeCond,
  });

  Future<LocalAlbum> refresh(
    String albumId, {
    bool withModifiedTime = true,
    bool withAssetCount = true,
  });
}

class DateTimeFilter {
  final DateTime min;
  final DateTime max;

  const DateTimeFilter({required this.min, required this.max});
}

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';

abstract interface class IAlbumMediaRepository {
  Future<List<LocalAlbum>> getAll({bool withModifiedTime = false});

  Future<List<LocalAsset>> getAssetsForAlbum(
    String albumId, {
    DateTimeFilter? updateTimeCond,
  });
}

class DateTimeFilter {
  final DateTime min;
  final DateTime max;

  const DateTimeFilter({required this.min, required this.max});
}

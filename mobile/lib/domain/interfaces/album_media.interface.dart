import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

abstract interface class IAlbumMediaRepository {
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

import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';

abstract interface class IAssetRepository {
  Future<List<Asset>> getByAlbumWithOwnerUnequal(Album album, User user);
  Future<void> deleteById(List<int> ids);
}

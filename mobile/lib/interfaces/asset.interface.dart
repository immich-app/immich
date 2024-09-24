import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';

abstract interface class IAssetRepository {
  Future<Asset?> getByRemoteId(String id);
  Future<List<Asset>> getAllByRemoteId(Iterable<String> ids);
  Future<List<Asset>> getByAlbum(Album album, {User? notOwnedBy});
  Future<void> deleteById(List<int> ids);
  Future<List<Asset>> getAll({
    required int ownerId,
    bool? remote,
    int limit = 100,
  });

  Future<List<Asset>> getMatches({
    required List<Asset> assets,
    required int ownerId,
    bool? remote,
    int limit = 100,
  });
}

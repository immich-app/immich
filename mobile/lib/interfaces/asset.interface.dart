import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/device_asset.entity.dart';
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
  Future<List<Asset>> updateAll(List<Asset> assets);

  Future<List<Asset>> getMatches({
    required List<Asset> assets,
    required int ownerId,
    bool? remote,
    int limit = 100,
  });

  Future<List<DeviceAsset?>> getDeviceAssetsById(List<Object> ids);
  Future<void> upsertDeviceAssets(List<DeviceAsset> deviceAssets);
}

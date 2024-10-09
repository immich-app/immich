import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/device_asset.entity.dart';
import 'package:immich_mobile/interfaces/database.interface.dart';

abstract interface class IAssetRepository implements IDatabaseRepository {
  Future<Asset?> getByRemoteId(String id);

  Future<Asset?> getByOwnerIdChecksum(int ownerId, String checksum);

  Future<List<Asset>> getAllByRemoteId(
    Iterable<String> ids, {
    AssetState? state,
  });

  Future<List<Asset?>> getAllByOwnerIdChecksum(
    List<int> ids,
    List<String> checksums,
  );

  Future<List<Asset>> getAll({
    required int ownerId,
    AssetState? state,
    AssetSort? sortBy,
    int? limit,
  });

  Future<List<Asset>> getAllLocal();

  Future<List<Asset>> getByAlbum(
    Album album, {
    Iterable<int> notOwnedBy = const [],
    int? ownerId,
    AssetState? state,
    AssetSort? sortBy,
  });

  Future<Asset> update(Asset asset);

  Future<List<Asset>> updateAll(List<Asset> assets);

  Future<void> deleteAllByRemoteId(List<String> ids, {AssetState? state});

  Future<void> deleteById(List<int> ids);

  Future<List<Asset>> getMatches({
    required List<Asset> assets,
    required int ownerId,
    AssetState? state,
    int limit = 100,
  });

  Future<List<DeviceAsset?>> getDeviceAssetsById(List<Object> ids);

  Future<void> upsertDeviceAssets(List<DeviceAsset> deviceAssets);

  Future<void> upsertDuplicatedAssets(Iterable<String> duplicatedAssets);

  Future<List<String>> getAllDuplicatedAssetIds();
}

enum AssetSort { checksum, ownerIdChecksum }

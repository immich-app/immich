import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
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
    required String ownerId,
    AssetState? state,
    AssetSort? sortBy,
    int? limit,
  });

  Future<List<Asset>> getAllLocal();

  Future<List<Asset>> getByAlbum(
    Album album, {
    Iterable<String> notOwnedBy = const [],
    String? ownerId,
    AssetState? state,
    AssetSort? sortBy,
  });

  Future<Asset> update(Asset asset);

  Future<List<Asset>> updateAll(List<Asset> assets);

  Future<void> deleteAllByRemoteId(List<String> ids, {AssetState? state});

  Future<void> deleteByIds(List<int> ids);

  Future<List<Asset>> getMatches({
    required List<Asset> assets,
    required String ownerId,
    AssetState? state,
    int limit = 100,
  });

  Future<void> upsertDuplicatedAssets(Iterable<String> duplicatedAssets);

  Future<List<String>> getAllDuplicatedAssetIds();

  Future<List<Asset>> getStackAssets(String stackId);

  Future<void> clearTable();

  Stream<Asset?> watchAsset(int id, {bool fireImmediately = false});

  Future<List<Asset>> getTrashAssets(String userId);

  Future<List<Asset>> getRecentlyTakenAssets(String userId);
  Future<List<Asset>> getMotionAssets(String userId);
}

enum AssetSort { checksum, ownerIdChecksum }

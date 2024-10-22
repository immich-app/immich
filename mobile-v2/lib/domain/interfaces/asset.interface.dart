import 'dart:async';

import 'package:immich_mobile/domain/models/asset.model.dart';

abstract interface class IAssetRepository {
  /// Batch upsert asset
  Future<bool> upsertAll(Iterable<Asset> assets);

  /// Removes assets with the [localIds]
  Future<List<Asset>> getForLocalIds(Iterable<String> localIds);

  /// Removes assets with the [remoteIds]
  Future<List<Asset>> getForRemoteIds(Iterable<String> remoteIds);

  /// Get assets with the [hashes]
  Future<List<Asset>> getForHashes(Iterable<String> hashes);

  /// Fetch assets from the [offset] with the [limit]
  Future<List<Asset>> getAll({int? offset, int? limit});

  /// Removes assets with the given [ids]
  Future<void> deleteIds(Iterable<int> ids);

  /// Removes all assets
  Future<bool> deleteAll();
}

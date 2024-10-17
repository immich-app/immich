import 'dart:async';

import 'package:immich_mobile/domain/models/asset.model.dart';

abstract interface class IAssetRepository {
  /// Batch upsert asset
  FutureOr<bool> upsertAll(Iterable<Asset> assets);

  /// Removes assets with the [localIds]
  FutureOr<List<Asset>> getForLocalIds(Iterable<String> localIds);

  /// Removes assets with the [remoteIds]
  FutureOr<List<Asset>> getForRemoteIds(Iterable<String> remoteIds);

  /// Get assets with the [hashes]
  FutureOr<List<Asset>> getForHashes(Iterable<String> hashes);

  /// Fetch assets from the [offset] with the [limit]
  FutureOr<List<Asset>> getAll({int? offset, int? limit});

  /// Removes assets with the given [ids]
  FutureOr<void> deleteIds(Iterable<int> ids);

  /// Removes all assets
  FutureOr<bool> deleteAll();
}

import 'dart:async';

import 'package:immich_mobile/domain/models/asset.model.dart';

abstract interface class IAssetRepository {
  /// Batch upsert asset
  FutureOr<bool> upsertAll(Iterable<Asset> assets);

  /// Removes assets with the [localIds]
  FutureOr<List<Asset>> getForLocalIds(List<String> localIds);

  /// Removes assets with the [remoteIds]
  FutureOr<List<Asset>> getForRemoteIds(List<String> remoteIds);

  /// Fetch assets from the [offset] with the [limit]
  FutureOr<List<Asset>> getAll({int? offset, int? limit});

  /// Removes assets with the given [ids]
  FutureOr<void> deleteIds(List<int> ids);

  /// Removes all assets
  FutureOr<bool> deleteAll();
}

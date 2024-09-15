import 'dart:async';

import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/render_list.model.dart';

abstract class IAssetRepository {
  /// Batch insert asset
  FutureOr<bool> addAll(Iterable<Asset> assets);

  /// Removes assets with the [localIds]
  FutureOr<List<Asset>> fetchLocalAssetsForIds(List<String> localIds);

  /// Removes assets with the [remoteIds]
  FutureOr<List<Asset>> fetchRemoteAssetsForIds(List<String> remoteIds);

  /// Removes assets with the given [ids]
  FutureOr<void> deleteAssetsForIds(List<int> ids);

  /// Removes all assets
  FutureOr<bool> clearAll();

  /// Fetch assets from the [offset] with the [limit]
  FutureOr<List<Asset>> fetchAssets({int? offset, int? limit});

  /// Streams assets as groups grouped by the group type passed
  Stream<RenderList> watchRenderList();
}

import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/render_list.model.dart';

abstract class IAssetRepository {
  /// Batch insert asset
  Future<bool> addAll(Iterable<Asset> assets);

  /// Removes all assets
  Future<bool> clearAll();

  /// Fetch assets from the [offset] with the [limit]
  Future<List<Asset>> fetchAssets({int? offset, int? limit});

  /// Streams assets as groups grouped by the group type passed
  Stream<RenderList> getRenderList();
}

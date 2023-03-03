import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/services/json_cache.dart';

@Deprecated("only kept to remove its files after migration")
class AssetCacheService extends JsonCache<List<Asset>> {
  AssetCacheService() : super("asset_cache");

  @override
  void put(List<Asset> data) {}

  @override
  Future<List<Asset>?> get() => Future.value(null);
}

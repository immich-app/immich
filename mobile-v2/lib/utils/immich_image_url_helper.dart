import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';
import 'package:openapi/api.dart';

class ImImageUrlHelper {
  const ImImageUrlHelper();

  static String get _serverUrl => di<ImmichApiClient>().basePath;

  static String getThumbnailUrl(
    final Asset asset, {
    AssetMediaSize type = AssetMediaSize.thumbnail,
  }) {
    return _getThumbnailUrlForRemoteId(asset.remoteId!, type: type);
  }

  static String getThumbnailCacheKey(
    final Asset asset, {
    AssetMediaSize type = AssetMediaSize.thumbnail,
  }) {
    return _getThumbnailCacheKeyForRemoteId(asset.remoteId!, type: type);
  }

  static String _getThumbnailCacheKeyForRemoteId(
    final String id, {
    AssetMediaSize type = AssetMediaSize.thumbnail,
  }) {
    if (type == AssetMediaSize.thumbnail) {
      return 'thumbnail-image-$id';
    }
    return 'preview-image-$id';
  }

  static String _getThumbnailUrlForRemoteId(
    final String id, {
    AssetMediaSize type = AssetMediaSize.thumbnail,
  }) {
    return '$_serverUrl/assets/$id/thumbnail?size=${type.value}';
  }
}

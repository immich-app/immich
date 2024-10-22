import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';

enum AssetMediaSize {
  preview._('preview'),
  thumbnail._('thumbnail');

  const AssetMediaSize._(this.value);

  final String value;
}

abstract final class ImImageUrlHelper {
  const ImImageUrlHelper();

  static String get _serverUrl => di<ImApiClient>().basePath;

  static String getUserAvatarUrl(final User user) {
    return '$_serverUrl/users/${user.id}/profile-image';
  }

  static String getThumbnailUrl(
    final Asset asset, {
    AssetMediaSize type = AssetMediaSize.thumbnail,
  }) {
    return getThumbnailUrlForRemoteId(asset.remoteId!, type: type);
  }

  static String getThumbnailCacheKey(
    final Asset asset, {
    AssetMediaSize type = AssetMediaSize.thumbnail,
  }) {
    return getThumbnailCacheKeyForRemoteId(asset.remoteId!, type: type);
  }

  static String getThumbnailCacheKeyForRemoteId(
    final String id, {
    AssetMediaSize type = AssetMediaSize.thumbnail,
  }) {
    if (type == AssetMediaSize.thumbnail) {
      return 'thumbnail-image-$id';
    }
    return 'preview-image-$id';
  }

  static String getThumbnailUrlForRemoteId(
    final String id, {
    AssetMediaSize type = AssetMediaSize.thumbnail,
  }) {
    return '$_serverUrl/assets/$id/thumbnail?size=${type.value}';
  }
}

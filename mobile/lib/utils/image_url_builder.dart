import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';

String getThumbnailUrl(
  final Asset asset, {
  AssetMediaSize type = AssetMediaSize.thumbnail,
}) {
  return getThumbnailUrlForRemoteId(asset.remoteId!, type: type);
}

String getThumbnailCacheKey(
  final Asset asset, {
  AssetMediaSize type = AssetMediaSize.thumbnail,
}) {
  return getThumbnailCacheKeyForRemoteId(asset.remoteId!, type: type);
}

String getThumbnailCacheKeyForRemoteId(
  final String id, {
  AssetMediaSize type = AssetMediaSize.thumbnail,
}) {
  if (type == AssetMediaSize.thumbnail) {
    return 'thumbnail-image-$id';
  } else {
    return '${id}_previewStage';
  }
}

String getAlbumThumbnailUrl(
  final Album album, {
  AssetMediaSize type = AssetMediaSize.thumbnail,
}) {
  if (album.thumbnail.value?.remoteId == null) {
    return '';
  }
  return getThumbnailUrlForRemoteId(
    album.thumbnail.value!.remoteId!,
    type: type,
  );
}

String getAlbumThumbNailCacheKey(
  final Album album, {
  AssetMediaSize type = AssetMediaSize.thumbnail,
}) {
  if (album.thumbnail.value?.remoteId == null) {
    return '';
  }
  return getThumbnailCacheKeyForRemoteId(
    album.thumbnail.value!.remoteId!,
    type: type,
  );
}

String getImageUrl(final Asset asset) {
  return getImageUrlFromId(asset.remoteId!);
}

String getImageUrlFromId(final String id) {
  return '${Store.get(StoreKey.serverEndpoint)}/assets/$id/thumbnail?size=preview';
}

String getImageCacheKey(final Asset asset) {
  // Assets from response DTOs do not have an isar id, querying which would give us the default autoIncrement id
  final isFromDto = asset.id == Isar.autoIncrement;
  return '${isFromDto ? asset.remoteId : asset.id}_fullStage';
}

String getThumbnailUrlForRemoteId(
  final String id, {
  AssetMediaSize type = AssetMediaSize.thumbnail,
}) {
  return '${Store.get(StoreKey.serverEndpoint)}/assets/$id/thumbnail?size=${type.value}';
}

String getFaceThumbnailUrl(final String personId) {
  return '${Store.get(StoreKey.serverEndpoint)}/people/$personId/thumbnail';
}

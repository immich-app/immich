import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:openapi/api.dart';

String getThumbnailUrl(
  final Asset asset, {
  ThumbnailFormat type = ThumbnailFormat.WEBP,
}) {
  return getThumbnailUrlForRemoteId(asset.remoteId!, type: type);
}

String getThumbnailCacheKey(
  final Asset asset, {
  ThumbnailFormat type = ThumbnailFormat.WEBP,
}) {
  return getThumbnailCacheKeyForRemoteId(asset.remoteId!, type: type);
}

String getThumbnailCacheKeyForRemoteId(
  final String id, {
  ThumbnailFormat type = ThumbnailFormat.WEBP,
}) {
  if (type == ThumbnailFormat.WEBP) {
    return 'thumbnail-image-$id';
  } else {
    return '${id}_previewStage';
  }
}

String getAlbumThumbnailUrl(
  final Album album, {
  ThumbnailFormat type = ThumbnailFormat.WEBP,
}) {
  if (album.thumbnail.value?.remoteId == null) {
    return '';
  }
  return getThumbnailUrlForRemoteId(album.thumbnail.value!.remoteId!,
      type: type,);
}

String getAlbumThumbNailCacheKey(
  final Album album, {
  ThumbnailFormat type = ThumbnailFormat.WEBP,
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
  return '${Store.get(StoreKey.serverEndpoint)}/asset/file/${asset.remoteId}?isThumb=false';
}

String getImageCacheKey(final Asset asset) {
  return '${asset.id}_fullStage';
}

String getThumbnailUrlForRemoteId(
  final String id, {
  ThumbnailFormat type = ThumbnailFormat.WEBP,
}) {
  return '${Store.get(StoreKey.serverEndpoint)}/asset/thumbnail/$id?format=${type.value}';
}

String getFaceThumbnailUrl(final String personId) {
  return '${Store.get(StoreKey.serverEndpoint)}/person/$personId/thumbnail';
}

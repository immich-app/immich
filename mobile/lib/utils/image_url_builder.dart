import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:isar/isar.dart';
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
  return getThumbnailUrlForRemoteId(
    album.thumbnail.value!.remoteId!,
    type: type,
  );
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
  return getImageUrlFromId(asset.remoteId!);
}

String getImageUrlFromId(final String id) {
  return '${Store.get(StoreKey.serverEndpoint)}/asset/file/$id?isThumb=false';
}

String getImageCacheKey(final Asset asset) {
  // Assets from response DTOs do not have an isar id, querying which would give us the default autoIncrement id
  final isFromDto = asset.id == Isar.autoIncrement;
  return '${isFromDto ? asset.remoteId : asset.id}_fullStage';
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

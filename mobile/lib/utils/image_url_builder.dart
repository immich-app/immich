import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:openapi/api.dart';

String getThumbnailUrl(final Asset asset, {AssetMediaSize type = AssetMediaSize.thumbnail}) {
  return getThumbnailUrlForRemoteId(asset.remoteId!, type: type);
}

String getThumbnailCacheKey(final Asset asset, {AssetMediaSize type = AssetMediaSize.thumbnail}) {
  return getThumbnailCacheKeyForRemoteId(asset.remoteId!, asset.thumbhash!, type: type);
}

String getThumbnailCacheKeyForRemoteId(
  final String id,
  final String thumbhash, {
  AssetMediaSize type = AssetMediaSize.thumbnail,
}) {
  if (type == AssetMediaSize.thumbnail) {
    return 'thumbnail-image-$id-$thumbhash';
  } else {
    return '${id}_${thumbhash}_previewStage';
  }
}

String getAlbumThumbnailUrl(final Album album, {AssetMediaSize type = AssetMediaSize.thumbnail}) {
  if (album.thumbnail.value?.remoteId == null) {
    return '';
  }
  return getThumbnailUrlForRemoteId(album.thumbnail.value!.remoteId!, type: type);
}

String getAlbumThumbNailCacheKey(final Album album, {AssetMediaSize type = AssetMediaSize.thumbnail}) {
  if (album.thumbnail.value?.remoteId == null) {
    return '';
  }
  return getThumbnailCacheKeyForRemoteId(
    album.thumbnail.value!.remoteId!,
    album.thumbnail.value!.thumbhash!,
    type: type,
  );
}

String getOriginalUrlForRemoteId(final String id, {bool edited = true}) {
  return '${Store.get(StoreKey.serverEndpoint)}/assets/$id/original?edited=$edited';
}

String getThumbnailUrlForRemoteId(
  final String id, {
  AssetMediaSize type = AssetMediaSize.thumbnail,
  bool edited = true,
}) {
  return '${Store.get(StoreKey.serverEndpoint)}/assets/$id/thumbnail?size=${type.value}&edited=$edited';
}

String getPlaybackUrlForRemoteId(final String id) {
  return '${Store.get(StoreKey.serverEndpoint)}/assets/$id/video/playback?';
}

String getFaceThumbnailUrl(final String personId) {
  return '${Store.get(StoreKey.serverEndpoint)}/people/$personId/thumbnail';
}

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:openapi/api.dart';

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

String getOriginalUrlForRemoteId(final String id, {bool edited = true}) {
  return '${Store.get(StoreKey.serverEndpoint)}/assets/$id/original?edited=$edited';
}

String getThumbnailUrlForRemoteId(
  final String id, {
  AssetMediaSize type = AssetMediaSize.thumbnail,
  bool edited = true,
  String? thumbhash,
}) {
  final url = '${Store.get(StoreKey.serverEndpoint)}/assets/$id/thumbnail?size=${type.value}&edited=$edited';
  return thumbhash != null ? '$url&c=${Uri.encodeComponent(thumbhash)}' : url;
}

String getPlaybackUrlForRemoteId(final String id) {
  return '${Store.get(StoreKey.serverEndpoint)}/assets/$id/video/playback?';
}

String getFaceThumbnailUrl(final String personId) {
  return '${Store.get(StoreKey.serverEndpoint)}/people/$personId/thumbnail';
}

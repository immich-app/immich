import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:openapi/api.dart';

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

String getPreviewUrlForRemoteId(final String id, {bool edited = true}) {
  return getThumbnailUrlForRemoteId(id, type: AssetMediaSize.preview, edited: edited);
}

String getPlaybackUrlForRemoteId(final String id) {
  return '${Store.get(StoreKey.serverEndpoint)}/assets/$id/video/playback?';
}

String getFaceThumbnailUrl(final String personId) {
  return '${Store.get(StoreKey.serverEndpoint)}/people/$personId/thumbnail';
}

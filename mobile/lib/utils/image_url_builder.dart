import 'package:immich_mobile/infrastructure/repositories/session.repository.dart';
import 'package:openapi/api.dart';

String getOriginalUrlForRemoteId(final String id, {bool edited = true}) {
  return '${SessionRepository.instance.session.serverEndpoint!}/assets/$id/original?edited=$edited';
}

String getThumbnailUrlForRemoteId(
  final String id, {
  AssetMediaSize type = AssetMediaSize.thumbnail,
  bool edited = true,
  String? thumbhash,
}) {
  final url = '${SessionRepository.instance.session.serverEndpoint!}/assets/$id/thumbnail?size=$type&edited=$edited';
  return thumbhash != null ? '$url&c=${Uri.encodeComponent(thumbhash)}' : url;
}

String getPlaybackUrlForRemoteId(final String id) {
  return '${SessionRepository.instance.session.serverEndpoint!}/assets/$id/video/playback?';
}

String getFaceThumbnailUrl(final String personId) {
  return '${SessionRepository.instance.session.serverEndpoint!}/people/$personId/thumbnail';
}

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:openapi/api.dart';

String getBaseURL() {
  final castingUrl = SettingsRepository.instance.appConfig.network.castingUrl;
  if (castingUrl != null && castingUrl.isNotEmpty) {
    return "$castingUrl/api";
  }
  return Store.get(StoreKey.serverEndpoint);
}

String getThumbnailUrlForRemoteId(
    final String id, {
      AssetMediaSize type = AssetMediaSize.thumbnail,
      bool edited = true,
      String? thumbhash
    }) {
  final base = getBaseURL();
  final url = '$base/assets/$id/thumbnail?size=$type&edited=$edited';
  return thumbhash != null ? '$url&c=${Uri.encodeComponent(thumbhash)}' : url;
}

String getPlaybackUrlForRemoteId(final String id) {
  final base = getBaseURL();
  return '$base/assets/$id/video/playback?';
}

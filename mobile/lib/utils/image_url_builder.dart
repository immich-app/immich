import 'package:hive/hive.dart';
import 'package:openapi/api.dart';

import '../constants/hive_box.dart';

String getThumbnailUrl(
  final AssetResponseDto asset, {
  ThumbnailFormat type = ThumbnailFormat.WEBP,
}) {
  return _getThumbnailUrl(asset.id, type: type);
}

String getAlbumThumbnailUrl(
  final AlbumResponseDto album, {
  ThumbnailFormat type = ThumbnailFormat.WEBP,
}) {
  if (album.albumThumbnailAssetId == null) {
    return '';
  }
  return _getThumbnailUrl(album.albumThumbnailAssetId!, type: type);
}

String getImageUrl(final AssetResponseDto asset) {
  final box = Hive.box(userInfoBox);
  return '${box.get(serverEndpointKey)}/asset/file?aid=${asset.deviceAssetId}&did=${asset.deviceId}&isThumb=false';
}

String _getThumbnailUrl(
  final String id, {
  ThumbnailFormat type = ThumbnailFormat.WEBP,
}) {
  final box = Hive.box(userInfoBox);

  return '${box.get(serverEndpointKey)}/asset/thumbnail/$id?format=${type.value}';
}

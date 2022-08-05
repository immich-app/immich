import 'package:hive/hive.dart';
import 'package:openapi/api.dart';

import '../constants/hive_box.dart';

String getThumbnailUrl(final AssetResponseDto asset,
    {ThumbnailFormat type = ThumbnailFormat.WEBP}) {
  final box = Hive.box(userInfoBox);

  return '${box.get(serverEndpointKey)}/asset/thumbnail/${asset.id}?format=${type.value}';
}

String getImageUrl(final AssetResponseDto asset) {
  final box = Hive.box(userInfoBox);
  return '${box.get(serverEndpointKey)}/asset/file?aid=${asset.deviceAssetId}&did=${asset.deviceId}&isThumb=false';
}

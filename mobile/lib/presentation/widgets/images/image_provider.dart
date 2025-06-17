import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';

ImageProvider getFullImageProvider(
  BaseAsset asset, {
  Size size = const Size(1080, 1920),
}) {
  if (_shouldUseLocalAsset(asset)) {
    return LocalFullImageProvider(asset: asset as LocalAsset, size: size);
  }

  final String assetId;
  if (asset is LocalAsset && asset.hasRemote) {
    assetId = asset.remoteId!;
  } else if (asset is Asset) {
    assetId = asset.id;
  } else {
    throw ArgumentError("Unsupported asset type: ${asset.runtimeType}");
  }

  return RemoteFullImageProvider(assetId: assetId);
}

ImageProvider getThumbnailImageProvider(
  BaseAsset asset, {
  Size size = const Size.square(256),
}) {
  if (_shouldUseLocalAsset(asset)) {
    return LocalThumbProvider(asset: asset as LocalAsset, size: size);
  }

  final String assetId;
  if (asset is LocalAsset && asset.hasRemote) {
    assetId = asset.remoteId!;
  } else if (asset is Asset) {
    assetId = asset.id;
  } else {
    throw ArgumentError("Unsupported asset type: ${asset.runtimeType}");
  }

  return RemoteThumbProvider(assetId: assetId);
}

bool _shouldUseLocalAsset(BaseAsset asset) =>
    asset is LocalAsset &&
    (!asset.hasRemote || !AppSetting.get(Setting.preferRemoteImage));

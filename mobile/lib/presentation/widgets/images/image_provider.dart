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
  // Create new provider and cache it
  final ImageProvider provider;
  if (_shouldUseLocalAsset(asset)) {
    provider = LocalFullImageProvider(asset: asset as LocalAsset, size: size);
  } else {
    final String assetId;
    if (asset is LocalAsset && asset.hasRemote) {
      assetId = asset.remoteId!;
    } else if (asset is RemoteAsset) {
      assetId = asset.id;
    } else {
      throw ArgumentError("Unsupported asset type: ${asset.runtimeType}");
    }
    provider = RemoteFullImageProvider(assetId: assetId);
  }

  return provider;
}

ImageProvider getThumbnailImageProvider({
  BaseAsset? asset,
  String? remoteId,
  Size size = const Size.square(256),
}) {
  assert(
    asset != null || remoteId != null,
    'Either asset or remoteId must be provided',
  );

  if (remoteId != null) {
    return RemoteThumbProvider(assetId: remoteId);
  }

  if (_shouldUseLocalAsset(asset!)) {
    return LocalThumbProvider(asset: asset as LocalAsset, size: size);
  }

  final String assetId;
  if (asset is LocalAsset && asset.hasRemote) {
    assetId = asset.remoteId!;
  } else if (asset is RemoteAsset) {
    assetId = asset.id;
  } else {
    throw ArgumentError("Unsupported asset type: ${asset.runtimeType}");
  }

  return RemoteThumbProvider(assetId: assetId);
}

bool _shouldUseLocalAsset(BaseAsset asset) =>
    asset is LocalAsset &&
    (!asset.hasRemote || !AppSetting.get(Setting.preferRemoteImage));

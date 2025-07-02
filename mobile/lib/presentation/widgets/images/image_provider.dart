import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';

// Cache for image providers to avoid recreating them during rebuilds
final Map<String, ImageProvider> _imageProviderCache = {};

ImageProvider getFullImageProvider(
  BaseAsset asset, {
  Size size = const Size(1080, 1920),
}) {
  // Create cache key based on asset properties and size
  final cacheKey = _createCacheKey(asset, size);

  // Return cached provider if available
  if (_imageProviderCache.containsKey(cacheKey)) {
    return _imageProviderCache[cacheKey]!;
  }

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

  // Cache the provider
  _imageProviderCache[cacheKey] = provider;
  return provider;
}

String _createCacheKey(BaseAsset asset, Size size) {
  if (asset is LocalAsset) {
    return 'local_${asset.id}_${asset.updatedAt}_${size.width}x${size.height}';
  } else if (asset is RemoteAsset) {
    return 'remote_${asset.id}_${size.width}x${size.height}';
  }
  return '${asset.runtimeType}_${asset.name}_${size.width}x${size.height}';
}

/// Clears the image provider cache to free up memory
void clearImageProviderCache() {
  _imageProviderCache.clear();
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

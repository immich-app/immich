import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:openapi/api.dart' as api;
import 'package:photo_manager_image_provider/photo_manager_image_provider.dart';

/// Renders an Asset using local data if available, else remote data
class ImmichImage extends StatelessWidget {
  const ImmichImage(
    this.asset, {
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.useGrayBoxPlaceholder = false,
    this.useProgressIndicator = false,
    this.type = api.ThumbnailFormat.WEBP,
    this.preferredLocalAssetSize = 250,
    super.key,
  });
  final Asset? asset;
  final bool useGrayBoxPlaceholder;
  final bool useProgressIndicator;
  final double? width;
  final double? height;
  final BoxFit fit;
  final api.ThumbnailFormat type;
  final int preferredLocalAssetSize;

  @override
  Widget build(BuildContext context) {
    if (this.asset == null) {
      return Container(
        decoration: const BoxDecoration(
          color: Colors.grey,
        ),
        child: SizedBox(
          width: width,
          height: height,
          child: const Center(
            child: Icon(Icons.no_photography),
          ),
        ),
      );
    }
    final Asset asset = this.asset!;
    if (useLocal(asset)) {
      return Image(
        image: localImageProvider(asset, size: preferredLocalAssetSize),
        width: width,
        height: height,
        fit: fit,
        frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
          if (wasSynchronouslyLoaded || frame != null) {
            return child;
          }

          // Show loading if desired
          return Stack(
            children: [
              if (useGrayBoxPlaceholder)
                const SizedBox.square(
                  dimension: 250,
                  child: DecoratedBox(
                    decoration: BoxDecoration(color: Colors.grey),
                  ),
                ),
              if (useProgressIndicator)
                const Center(
                  child: CircularProgressIndicator(),
                ),
            ],
          );
        },
        errorBuilder: (context, error, stackTrace) {
          if (error is PlatformException &&
              error.code == "The asset not found!") {
            debugPrint(
              "Asset ${asset.localId} does not exist anymore on device!",
            );
          } else {
            debugPrint(
              "Error getting thumb for assetId=${asset.localId}: $error",
            );
          }
          return Icon(
            Icons.image_not_supported_outlined,
            color: context.primaryColor,
          );
        },
      );
    }
    final String? accessToken = Store.get(StoreKey.accessToken);
    final String thumbnailRequestUrl = getThumbnailUrl(asset, type: type);
    return CachedNetworkImage(
      imageUrl: thumbnailRequestUrl,
      httpHeaders: {"x-immich-user-token": accessToken ?? ""},
      cacheKey: getThumbnailCacheKey(asset, type: type),
      width: width,
      height: height,
      // keeping memCacheWidth, memCacheHeight, maxWidthDiskCache and
      // maxHeightDiskCache = null allows to simply store the webp thumbnail
      // from the server and use it for all rendered thumbnail sizes
      fit: fit,
      fadeInDuration: const Duration(milliseconds: 250),
      progressIndicatorBuilder: (context, url, downloadProgress) {
        // Show loading if desired
        return Stack(
          children: [
            if (useGrayBoxPlaceholder)
              const SizedBox.square(
                dimension: 250,
                child: DecoratedBox(
                  decoration: BoxDecoration(color: Colors.grey),
                ),
              ),
            if (useProgressIndicator)
              Transform.scale(
                scale: 2,
                child: Center(
                  child: CircularProgressIndicator.adaptive(
                    strokeWidth: 1,
                    value: downloadProgress.progress,
                  ),
                ),
              ),
          ],
        );
      },
      errorWidget: (context, url, error) {
        if (error is HttpExceptionWithStatus &&
            error.statusCode >= 400 &&
            error.statusCode < 500) {
          debugPrint("Evicting thumbnail '$url' from cache: $error");
          CachedNetworkImage.evictFromCache(url);
        }
        return Icon(
          Icons.image_not_supported_outlined,
          color: context.primaryColor,
        );
      },
    );
  }

  static AssetEntityImageProvider localImageProvider(
    Asset asset, {
    int size = 250,
  }) =>
      AssetEntityImageProvider(
        asset.local!,
        isOriginal: false,
        thumbnailSize: ThumbnailSize.square(size),
      );

  static CachedNetworkImageProvider remoteThumbnailProvider(
    Asset asset,
    api.ThumbnailFormat type,
    Map<String, String> authHeader,
  ) =>
      CachedNetworkImageProvider(
        getThumbnailUrl(asset, type: type),
        cacheKey: getThumbnailCacheKey(asset, type: type),
        headers: authHeader,
      );

  /// TODO: refactor image providers to separate class
  static CachedNetworkImageProvider remoteThumbnailProviderForId(
    String assetId, {
    api.ThumbnailFormat type = api.ThumbnailFormat.WEBP,
  }) =>
      CachedNetworkImageProvider(
        getThumbnailUrlForRemoteId(assetId, type: type),
        cacheKey: getThumbnailCacheKeyForRemoteId(assetId, type: type),
        headers: {
          "x-immich-user-token": Store.get(StoreKey.accessToken),
        },
      );

  /// Precaches this asset for instant load the next time it is shown
  static Future<void> precacheAsset(
    Asset asset,
    BuildContext context, {
    type = api.ThumbnailFormat.WEBP,
    size = 250,
  }) {
    if (useLocal(asset)) {
      // Precache the local image
      return precacheImage(
        localImageProvider(asset, size: size),
        context,
      );
    } else {
      final accessToken = Store.get(StoreKey.accessToken);
      // Precache the remote image since we are not using local images
      return precacheImage(
        remoteThumbnailProvider(asset, type, {"x-immich-user-token": accessToken}),
        context,
      );
    }
  }

  static bool useLocal(Asset asset) =>
      !asset.isRemote ||
      asset.isLocal && !Store.get(StoreKey.preferRemoteImage, false);
}

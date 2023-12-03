import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:flutter_thumbhash/flutter_thumbhash.dart';
import 'package:image_fade/image_fade.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:openapi/api.dart' as api;

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
    super.key,
  });
  final Asset? asset;
  final bool useGrayBoxPlaceholder;
  final bool useProgressIndicator;
  final double? width;
  final double? height;
  final BoxFit fit;
  final api.ThumbnailFormat type;

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
        image: localThumbnailProvider(asset),
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
    final String? token = Store.get(StoreKey.accessToken);
    final String thumbnailRequestUrl = getThumbnailUrl(asset, type: type);
    Widget placeholderWidget;
    if (asset.thumbhash != null) {
      placeholderWidget = FittedBox(
        fit: BoxFit.fill,
        child: Image(
          image: ThumbHash.fromIntList(asset.thumbhash!).toImage(),
        ),
      );
    } else if (useGrayBoxPlaceholder) {
      placeholderWidget = const DecoratedBox(
        decoration: BoxDecoration(color: Colors.grey),
      );
    } else {
      placeholderWidget = Transform.scale(
        scale: 0.2,
        child: const CircularProgressIndicator(),
      );
    }

    return ImageFade(
      width: width,
      height: height,
      image: CachedNetworkImageProvider(
        thumbnailRequestUrl,
        headers: {"Authorization": "Bearer $token"},
        cacheKey: getThumbnailCacheKey(asset, type: type),
      ),
      fit: fit,
      duration: const Duration(milliseconds: 300),
      syncDuration: const Duration(milliseconds: 0),
      placeholder: placeholderWidget,
      errorBuilder: (context, error) {
        if (error is HttpExceptionWithStatus &&
            error.statusCode >= 400 &&
            error.statusCode < 500) {
          debugPrint(
            "Evicting thumbnail '$thumbnailRequestUrl' from cache: $error",
          );
          CachedNetworkImage.evictFromCache(thumbnailRequestUrl);
        }
        return Icon(
          Icons.image_not_supported_outlined,
          color: context.primaryColor,
        );
      },
    );
  }

  static AssetEntityImageProvider localThumbnailProvider(Asset asset) =>
      AssetEntityImageProvider(
        asset.local!,
        isOriginal: false,
        thumbnailSize: const ThumbnailSize.square(250),
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

  /// Precaches this asset for instant load the next time it is shown
  static Future<void> precacheAsset(
    Asset asset,
    BuildContext context, {
    type = api.ThumbnailFormat.WEBP,
  }) {
    if (useLocal(asset)) {
      // Precache the local image
      return precacheImage(localThumbnailProvider(asset), context);
    } else {
      final authToken = 'Bearer ${Store.get(StoreKey.accessToken)}';
      // Precache the remote image since we are not using local images
      return precacheImage(
        remoteThumbnailProvider(asset, type, {"Authorization": authToken}),
        context,
      );
    }
  }

  static bool useLocal(Asset asset) =>
      !asset.isRemote ||
      asset.isLocal && !Store.get(StoreKey.preferRemoteImage, false);
}

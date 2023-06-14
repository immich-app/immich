import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:photo_manager/photo_manager.dart';

/// Renders an Asset using local data if available, else remote data
class ImmichImage extends StatelessWidget {
  const ImmichImage(
    this.asset, {
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.useGrayBoxPlaceholder = false,
    super.key,
  });
  final Asset? asset;
  final bool useGrayBoxPlaceholder;
  final double? width;
  final double? height;
  final BoxFit fit;

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
    if (asset.isLocal) {
      return Image(
        image: AssetEntityImageProvider(
          asset.local!,
          isOriginal: false,
          thumbnailSize: const ThumbnailSize.square(250), // like server thumbs
        ),
        width: width,
        height: height,
        fit: fit,
        frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
          if (wasSynchronouslyLoaded || frame != null) {
            return child;
          }
          return (useGrayBoxPlaceholder
              ? const SizedBox.square(
                  dimension: 250,
                  child: DecoratedBox(
                    decoration: BoxDecoration(color: Colors.grey),
                  ),
                )
              : Transform.scale(
                  scale: 0.2,
                  child: const CircularProgressIndicator(),
                ));
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
            color: Theme.of(context).primaryColor,
          );
        },
      );
    }
    final String? token = Store.get(StoreKey.accessToken);
    final String thumbnailRequestUrl = getThumbnailUrl(asset);
    return CachedNetworkImage(
      imageUrl: thumbnailRequestUrl,
      httpHeaders: {"Authorization": "Bearer $token"},
      cacheKey: getThumbnailCacheKey(asset),
      width: width,
      height: height,
      // keeping memCacheWidth, memCacheHeight, maxWidthDiskCache and
      // maxHeightDiskCache = null allows to simply store the webp thumbnail
      // from the server and use it for all rendered thumbnail sizes
      fit: fit,
      fadeInDuration: const Duration(milliseconds: 250),
      progressIndicatorBuilder: (context, url, downloadProgress) {
        if (useGrayBoxPlaceholder) {
          return const DecoratedBox(
            decoration: BoxDecoration(color: Colors.grey),
          );
        }
        return Transform.scale(
          scale: 0.2,
          child: CircularProgressIndicator(
            value: downloadProgress.progress,
          ),
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
          color: Theme.of(context).primaryColor,
        );
      },
    );
  }
}

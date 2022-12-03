import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:photo_manager/photo_manager.dart';

/// Renders an Asset using local data if available, else remote data
class ImmichImage extends StatelessWidget {
  const ImmichImage(
    this.asset, {
    required this.width,
    required this.height,
    this.useGrayBoxPlaceholder = false,
    super.key,
  });
  final Asset asset;
  final bool useGrayBoxPlaceholder;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    if (asset.isLocal) {
      return Image(
        image: AssetEntityImageProvider(
          asset.local!,
          isOriginal: false,
          thumbnailSize: const ThumbnailSize.square(250), // like server thumbs
        ),
        width: width,
        height: height,
        fit: BoxFit.cover,
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
          debugPrint("Error getting thumb for assetId=${asset.id}: $error");
          return Icon(
            Icons.image_not_supported_outlined,
            color: Theme.of(context).primaryColor,
          );
        },
      );
    }
    final String token = Hive.box(userInfoBox).get(accessTokenKey);
    final String thumbnailRequestUrl = getThumbnailUrl(asset.remote!);
    return CachedNetworkImage(
      imageUrl: thumbnailRequestUrl,
      httpHeaders: {"Authorization": "Bearer $token"},
      cacheKey: getThumbnailCacheKey(asset.remote!),
      width: width,
      height: height,
      // keeping memCacheWidth, memCacheHeight, maxWidthDiskCache and
      // maxHeightDiskCache = null allows to simply store the webp thumbnail
      // from the server and use it for all rendered thumbnail sizes
      fit: BoxFit.cover,
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
        debugPrint("Error getting thumbnail $url = $error");
        CachedNetworkImage.evictFromCache(thumbnailRequestUrl);
        return Icon(
          Icons.image_not_supported_outlined,
          color: Theme.of(context).primaryColor,
        );
      },
    );
  }
}

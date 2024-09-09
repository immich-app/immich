import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';
import 'package:immich_mobile/utils/immich_image_url_helper.dart';
import 'package:material_symbols_icons/symbols.dart';

class ImImage extends StatelessWidget {
  final Asset asset;
  final double? width;
  final double? height;

  const ImImage(this.asset, {this.width, this.height, super.key});

  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: ImImageUrlHelper.getThumbnailUrl(asset),
      httpHeaders: di<ImmichApiClient>().headers,
      cacheKey: ImImageUrlHelper.getThumbnailUrl(asset),
      width: width,
      height: height,
      // keeping memCacheWidth, memCacheHeight, maxWidthDiskCache and
      // maxHeightDiskCache = null allows to simply store the webp thumbnail
      // from the server and use it for all rendered thumbnail sizes
      fit: BoxFit.cover,
      fadeInDuration: const Duration(milliseconds: 250),
      progressIndicatorBuilder: (_, url, downloadProgress) {
        // Show loading if desired
        return const SizedBox.square(
          dimension: 250,
          child: DecoratedBox(decoration: BoxDecoration(color: Colors.grey)),
        );
      },
      errorWidget: (_, url, error) {
        if (error is HttpExceptionWithStatus &&
            error.statusCode >= 400 &&
            error.statusCode < 500) {
          CachedNetworkImage.evictFromCache(url);
        }
        return Icon(
          Symbols.image_not_supported_rounded,
          color: Theme.of(context).primaryColor,
        );
      },
    );
  }
}

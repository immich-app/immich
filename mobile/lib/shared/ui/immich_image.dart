import 'dart:typed_data';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
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
      // return _LocalImage(
      //   asset.local!,
      //   width: width,
      //   height: height,
      // );
      return Image(
        image: AssetEntityImageProvider(
          asset.local!,
          isOriginal: false,
          thumbnailSize: const ThumbnailSize.square(250),
        ),
        width: width,
        height: height,
        fit: BoxFit.cover,
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
      cacheKey: 'thumbnail-image-${asset.id}',
      width: width,
      height: height,
      memCacheWidth: width.toInt(),
      memCacheHeight: height.toInt(),
      maxWidthDiskCache: 200,
      maxHeightDiskCache: 200,
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

/// Alternative to using AssetEntityImageProvider:
/// gives more configurability?
class _LocalImage extends ConsumerWidget {
  const _LocalImage(this.asset, {required this.width, required this.height});
  final AssetEntity asset;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Uint8List> image = ref.watch(_imageFamily(asset));
    return image.when(
      data: (data) => Image.memory(
        data,
        width: width,
        height: height,
        fit: BoxFit.cover,
      ),
      error: (error, stackTrace) => Icon(
        Icons.image_not_supported_outlined,
        color: Theme.of(context).primaryColor,
      ),
      loading: () => SizedBox(
        width: width,
        height: height,
      ),
    );
  }
}

final _imageFamily =
    FutureProvider.family<Uint8List, AssetEntity>((ref, entity) async {
  // settings match thumbnails generated on the server (but jpg instead of webp)
  final bytes = await entity
      .thumbnailDataWithSize(const ThumbnailSize.square(250), quality: 80);
  if (bytes == null) {
    throw Exception();
  }
  return bytes;
});

import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/image_providers/immich_local_image_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/image_providers/immich_local_thumbnail_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/image_providers/immich_remote_image_provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/thumbnail_placeholder.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:octo_image/octo_image.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:photo_manager_image_provider/photo_manager_image_provider.dart';

class ImmichThumbnail extends StatelessWidget {
  const ImmichThumbnail({
    this.asset,
    this.width = 250,
    this.height = 250,
    this.fit = BoxFit.cover,
    this.placeholder,
    super.key,
  });

  final Asset? asset;
  final Widget? placeholder;
  final double width;
  final double height;
  final BoxFit fit;

  // Helper function to return the image provider for the asset
  // either by using the asset ID or the asset itself
  /// [asset] is the Asset to request, or else use [assetId] to get a remote
  /// image provider
  /// Use [isThumbnail] and [thumbnailSize] if you'd like to request a thumbnail
  /// The size of the square thumbnail to request. Ignored if isThumbnail
  /// is not true
  static ImageProvider imageProvider({
    Asset? asset,
    String? assetId,
    int thumbnailSize = 256,
  }) {
    if (asset == null && assetId == null) {
      throw Exception('Must supply either asset or assetId');
    }

    if (asset == null) {
      return ImmichRemoteImageProvider(
        assetId: assetId!,
        isThumbnail: true,
      );
    }

    if (useLocal(asset)) {
      return ImmichLocalThumbnailProvider(
        asset: asset,
        height: thumbnailSize,
        width: thumbnailSize,
      );
    } else {
      return ImmichRemoteImageProvider(
        assetId: asset.remoteId!,
        isThumbnail: true,
      );
    }
  }

  static bool useLocal(Asset asset) => !asset.isRemote || asset.isLocal;

  @override
  Widget build(BuildContext context) {
    if (asset == null) {
      return Container(
        color: Colors.grey,
        width: width,
        height: height,
        child: const Center(
          child: Icon(Icons.no_photography),
        ),
      );
    }

    return OctoImage(
      fadeInDuration: const Duration(milliseconds: 0),
      fadeOutDuration: const Duration(milliseconds: 100),
      placeholderBuilder: (context) {
        return placeholder ??
            ThumbnailPlaceholder(
              height: height,
              width: width,
            );
      },
      image: ImmichThumbnail.imageProvider(
        asset: asset,
      ),
      width: width,
      height: height,
      fit: fit,
      errorBuilder: (context, error, stackTrace) {
        if (error is PlatformException &&
            error.code == "The asset not found!") {
          debugPrint(
            "Asset ${asset?.localId} does not exist anymore on device!",
          );
        } else {
          debugPrint(
            "Error getting thumb for assetId=${asset?.localId}: $error",
          );
        }
        return Icon(
          Icons.image_not_supported_outlined,
          color: context.primaryColor,
        );
      },
    );
  }
}

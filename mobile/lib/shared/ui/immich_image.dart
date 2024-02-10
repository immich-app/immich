import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/image_providers/immich_local_image_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/image_providers/immich_remote_image_provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
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
    return Image(
      image: ImmichImage.imageProvider(asset: asset),
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

  static bool useLocal(Asset asset) =>
      !asset.isRemote ||
      asset.isLocal && !Store.get(StoreKey.preferRemoteImage, false);

  /// A helper function to use the correct image loader based on
  /// whether the asset should be local or remote
  /// Precaches this asset for instant load the next time it is shown
  static Future<void> precacheAssetImageProvider(
    Asset asset,
    BuildContext context, {
    api.ThumbnailFormat type = api.ThumbnailFormat.WEBP,
    int size = 250,
    ImageErrorListener? onError,
  }) {
    if (useLocal(asset)) {
      return precacheImage(
        ImmichLocalImageProvider(asset: asset),
        context,
        onError: onError,
      );
    } else {
      return precacheImage(
        ImmichRemoteImageProvider(assetId: asset.remoteId!),
        context,
        onError: onError,
      );
    }
  }

  // Helper function to return the image provider for the asset
  // either by using the asset ID or the asset itself
  static ImageProvider imageProvider({Asset? asset, String? assetId}) {
    if (asset == null && assetId == null) {
      throw Exception('Must supply either asset or assetId');
    }

    if (asset == null) {
      return ImmichRemoteImageProvider(assetId: assetId!);
    } else if (useLocal(asset)) {
      return ImmichLocalImageProvider(asset: asset);
    } else {
      return ImmichRemoteImageProvider(assetId: asset.remoteId!);
    }
  }
}

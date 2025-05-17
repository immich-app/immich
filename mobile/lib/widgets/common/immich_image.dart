import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/image/immich_local_image_provider.dart';
import 'package:immich_mobile/providers/image/immich_remote_image_provider.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_placeholder.dart';
import 'package:octo_image/octo_image.dart';

class ImmichImage extends StatelessWidget {
  const ImmichImage(
    this.asset, {
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.placeholder = const ThumbnailPlaceholder(),
    super.key,
  });

  final Asset? asset;
  final Widget? placeholder;
  final double? width;
  final double? height;
  final BoxFit fit;

  // Helper function to return the image provider for the asset
  // either by using the asset ID or the asset itself
  /// [asset] is the Asset to request, or else use [assetId] to get a remote
  /// image provider
  static ImageProvider imageProvider({
    Asset? asset,
    String? assetId,
    double width = 1080,
    double height = 1920,
  }) {
    if (asset == null && assetId == null) {
      throw Exception('Must supply either asset or assetId');
    }

    if (asset == null) {
      return ImmichRemoteImageProvider(
        assetId: assetId!,
      );
    }

    if (useLocal(asset)) {
      return ImmichLocalImageProvider(
        asset: asset,
        width: width,
        height: height,
      );
    } else {
      return ImmichRemoteImageProvider(
        assetId: asset.remoteId!,
      );
    }
  }

  // Whether to use the local asset image provider or a remote one
  static bool useLocal(Asset asset) =>
      !asset.isRemote ||
      asset.isLocal && !Store.get(StoreKey.preferRemoteImage, false);

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

    final double requestWidth = width ?? context.width;
    final double requestHeight = height ?? context.height;

    final imageProviderInstance = ImmichImage.imageProvider(
      asset: asset,
      width: requestWidth,
      height: requestHeight,
    );

    return OctoImage(
      fadeInDuration: const Duration(milliseconds: 0),
      fadeOutDuration: const Duration(milliseconds: 100),
      placeholderBuilder: (context) {
        if (placeholder != null) {
          return placeholder!;
        }
        return const SizedBox();
      },
      image: imageProviderInstance,
      width: width,
      height: height,
      fit: fit,
      errorBuilder: (context, error, stackTrace) {
        imageProviderInstance.evict();

        return Icon(
          Icons.image_not_supported_outlined,
          size: 32,
          color: Colors.red[200],
        );
      },
    );
  }
}

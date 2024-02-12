import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/image_providers/immich_local_image_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/image_providers/immich_remote_image_provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:photo_manager_image_provider/photo_manager_image_provider.dart';
import 'package:thumbhash/thumbhash.dart' as thumbhash;

/// Renders an Asset using local data if available, else remote data
class ImmichImage extends StatefulWidget {
  const ImmichImage(
    this.asset, {
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.useGrayBoxPlaceholder = false,
    this.useProgressIndicator = false,
    this.isThumbnail = false,
    this.thumbnailSize = 250,
    super.key,
  });
  final Asset? asset;
  final bool useGrayBoxPlaceholder;
  final bool useProgressIndicator;
  final double? width;
  final double? height;
  final BoxFit fit;
  final bool isThumbnail;
  final int thumbnailSize;

  /// Factory constructor to use the thumbnail variant
  factory ImmichImage.thumbnail(
    Asset? asset, {
    BoxFit fit = BoxFit.cover,
    double? width,
    double? height,
  }) {
    return ImmichImage(
      asset,
      isThumbnail: true,
      fit: fit,
      width: width,
      height: height,
    );
  }

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
      image: ImmichImage.imageProvider(
        asset: asset,
        isThumbnail: isThumbnail,
        thumbnailSize: thumbnailSize,
      ),
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
    bool isThumbnail = false,
    int thumbnailSize = 250,
  }) {
    if (asset == null && assetId == null) {
      throw Exception('Must supply either asset or assetId');
    }

    if (asset == null) {
      return ImmichRemoteImageProvider(
        assetId: assetId!,
        isThumbnail: isThumbnail,
      );
    }

    if (useLocal(asset) && isThumbnail) {
      return AssetEntityImageProvider(
        asset.local!,
        isOriginal: false,
        thumbnailSize: ThumbnailSize.square(thumbnailSize),
      );
    } else if (useLocal(asset) && !isThumbnail) {
      return ImmichLocalImageProvider(
        asset: asset,
      );
    } else {
      return ImmichRemoteImageProvider(
        assetId: asset.remoteId!,
        isThumbnail: isThumbnail,
      );
    }
  }
}

class _ImmichImageState extends State<ImmichImage> {
  // Creating the Uint8List from the List<bytes> during each build results in flickers during
  // the fade transition. Calculate the hash in the initState and cache it for further builds
  Uint8List? thumbHashBytes;
  static const _placeholderDimension = 300.0;

  @override
  void initState() {
    super.initState();
    if (widget.asset?.thumbhash != null) {
      final bytes = Uint8List.fromList(widget.asset!.thumbhash!);
      final rgbaImage = thumbhash.thumbHashToRGBA(bytes);
      thumbHashBytes = thumbhash.rgbaToBmp(rgbaImage);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.asset == null) {
      return Container(
        decoration: const BoxDecoration(
          color: Colors.grey,
        ),
        child: SizedBox(
          width: widget.width,
          height: widget.height,
          child: const Center(
            child: Icon(Icons.no_photography),
          ),
        ),
      );
    }

    final Asset asset = widget.asset!;

    return Image(
      image: ImmichImage.imageProvider(
        asset: asset,
        isThumbnail: widget.isThumbnail,
      ),
      width: widget.width,
      height: widget.height,
      fit: widget.fit,
      loadingBuilder: (_, child, loadingProgress) {
        return AnimatedOpacity(
          opacity: loadingProgress != null ? 0 : 1,
          duration: const Duration(seconds: 1),
          curve: Curves.easeOut,
          child: child,
        );
      },
      frameBuilder: (_, child, frame, wasSynchronouslyLoaded) {
        if (wasSynchronouslyLoaded || frame != null) {
          return child;
        }

        return Stack(
          alignment: Alignment.center,
          children: [
            if (widget.useGrayBoxPlaceholder)
              const SizedBox.square(
                dimension: _placeholderDimension,
                child: DecoratedBox(
                  decoration: BoxDecoration(color: Colors.grey),
                ),
              ),
            if (thumbHashBytes != null)
              Image.memory(
                thumbHashBytes!,
                width: _placeholderDimension,
                height: _placeholderDimension,
                fit: BoxFit.cover,
              ),
            if (widget.useProgressIndicator)
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
}

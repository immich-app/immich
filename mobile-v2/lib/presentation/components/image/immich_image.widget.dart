import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/presentation/components/image/provider/immich_local_image_provider.dart';
import 'package:immich_mobile/presentation/components/image/provider/immich_remote_thumbnail_provider.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';
import 'package:octo_image/octo_image.dart';

class ImImagePlaceholder extends StatelessWidget {
  const ImImagePlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: context.colorScheme.surfaceContainerHighest,
      width: 200,
      height: 200,
    );
  }
}

// ignore: prefer-single-widget-per-file
class ImImage extends StatefulWidget {
  final Asset asset;
  final double? width;
  final double? height;
  final Widget placeholder;

  const ImImage(
    this.asset, {
    this.width,
    this.height,
    this.placeholder = const ImImagePlaceholder(),
    super.key,
  });

  // Helper function to return the image provider for the asset
  // either by using the asset ID or the asset itself
  /// [asset] is the Asset to request, or else use [assetId] to get a remote
  /// image provider
  /// Use [isThumbnail] and [thumbnailSize] if you'd like to request a thumbnail
  /// The size of the square thumbnail to request. Ignored if isThumbnail
  /// is not true
  static ImageProvider imageProvider({Asset? asset, String? assetId}) {
    if (asset == null && assetId == null) {
      throw Exception('Must supply either asset or assetId');
    }

    if (asset == null) {
      return ImmichRemoteThumbnailProvider(assetId: assetId!);
    }

    // Whether to use the local asset image provider or a remote one
    final useLocal = !asset.isRemote || asset.isLocal;

    if (useLocal) {
      return ImLocalImageProvider(asset: asset);
    }

    return ImmichRemoteThumbnailProvider(assetId: asset.remoteId!);
  }

  @override
  State createState() => _ImImageState();
}

class _ImImageState extends State<ImImage> {
  late DisposableBuildContext _context;

  @override
  void initState() {
    super.initState();
    _context = DisposableBuildContext(this);
  }

  @override
  void dispose() {
    _context.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return OctoImage(
      image: ScrollAwareImageProvider(
        context: _context,
        imageProvider: ImImage.imageProvider(asset: widget.asset),
      ),
      placeholderBuilder: (_) => widget.placeholder,
      errorBuilder: (_, error, stackTrace) {
        if (error is PlatformException &&
            error.code == "The asset not found!") {
          debugPrint(
            "Asset ${widget.asset.localId ?? widget.asset.id ?? "-"} does not exist anymore on device!",
          );
        } else {
          debugPrint(
            "Error getting thumb for assetId=${widget.asset.localId ?? widget.asset.id ?? "-"}: $error",
          );
        }
        return Icon(
          Icons.image_not_supported_outlined,
          color: context.colorScheme.primary,
        );
      },
      fadeOutDuration: Durations.short4,
      fadeInDuration: Duration.zero,
      width: widget.width,
      height: widget.height,
      fit: BoxFit.cover,
    );
  }
}

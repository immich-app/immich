import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_placeholder.dart';
import 'package:octo_image/octo_image.dart';

class FullImage extends StatelessWidget {
  const FullImage(
    this.asset, {
    required this.size,
    this.fit = BoxFit.cover,
    this.placeholder = const ThumbnailPlaceholder(),
    super.key,
  });

  final BaseAsset asset;
  final Size size;
  final Widget? placeholder;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    final provider = getFullImageProvider(asset, size: size);
    return OctoImage(
      fadeInDuration: const Duration(milliseconds: 0),
      fadeOutDuration: const Duration(milliseconds: 100),
      placeholderBuilder: placeholder != null ? (_) => placeholder! : null,
      image: provider,
      width: size.width,
      height: size.height,
      fit: fit,
      errorBuilder: (context, error, stackTrace) {
        provider.evict();
        return const Icon(Icons.image_not_supported_outlined, size: 32);
      },
    );
  }
}

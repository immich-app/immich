import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_placeholder.dart';
import 'package:immich_mobile/widgets/common/fade_in_placeholder_image.dart';
import 'package:logging/logging.dart';
import 'package:octo_image/octo_image.dart';

class ImThumbnail extends StatelessWidget {
  const ImThumbnail({
    required this.asset,
    this.size = const Size.square(256),
    this.fit = BoxFit.cover,
    super.key,
  });

  final BaseAsset asset;
  final Size size;
  final BoxFit fit;

  static ImageProvider imageProvider({
    required BaseAsset asset,
    Size size = const Size.square(256),
  }) =>
      ImLocalThumbnailProvider(
        asset: asset as LocalAsset,
        height: size.height,
        width: size.width,
      );

  @override
  Widget build(BuildContext context) {
    return OctoImage.fromSet(
      image: ImThumbnail.imageProvider(asset: asset, size: size),
      octoSet: _blurHashOrPlaceholder(null, fit: fit),
      fadeOutDuration: const Duration(milliseconds: 100),
      fadeInDuration: Duration.zero,
      width: size.width,
      height: size.height,
      fit: fit,
      placeholderFadeInDuration: Duration.zero,
    );
  }
}

OctoSet _blurHashOrPlaceholder(Uint8List? blurhash, {BoxFit? fit}) {
  return OctoSet(
    placeholderBuilder: _blurHashPlaceholderBuilder(blurhash, fit: fit),
    errorBuilder: _blurHashErrorBuilder(blurhash, fit: fit),
  );
}

OctoPlaceholderBuilder _blurHashPlaceholderBuilder(
  Uint8List? blurhash, {
  BoxFit? fit,
}) {
  return (context) => blurhash == null
      ? const ThumbnailPlaceholder()
      : FadeInPlaceholderImage(
          placeholder: const ThumbnailPlaceholder(),
          image: MemoryImage(blurhash),
          fit: fit ?? BoxFit.cover,
        );
}

OctoErrorBuilder _blurHashErrorBuilder(Uint8List? blurhash, {BoxFit? fit}) =>
    (context, e, s) {
      Logger("ImThumbnail").warning("Error loading thumbnail: $e", e, s);
      return Stack(
        alignment: Alignment.center,
        children: [
          _blurHashPlaceholderBuilder(blurhash, fit: fit)(context),
          const Opacity(
            opacity: 0.75,
            child: Icon(Icons.error_outline_rounded),
          ),
        ],
      );
    };

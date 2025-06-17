import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumb_hash_provider.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_placeholder.dart';
import 'package:immich_mobile/widgets/common/fade_in_placeholder_image.dart';
import 'package:logging/logging.dart';
import 'package:octo_image/octo_image.dart';

class Thumbnail extends StatelessWidget {
  const Thumbnail({
    required this.asset,
    this.size = const Size.square(256),
    this.fit = BoxFit.cover,
    super.key,
  });

  final BaseAsset asset;
  final Size size;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    final thumbHash = asset is Asset ? (asset as Asset).thumbHash : null;
    final provider = getThumbnailImageProvider(asset, size: size);
    return OctoImage.fromSet(
      image: provider,
      octoSet: OctoSet(
        placeholderBuilder: _blurHashPlaceholderBuilder(thumbHash, fit: fit),
        errorBuilder: _blurHashErrorBuilder(
          thumbHash,
          provider: provider,
          fit: fit,
          asset: asset,
        ),
      ),
      fadeOutDuration: const Duration(milliseconds: 100),
      fadeInDuration: Duration.zero,
      width: size.width,
      height: size.height,
      fit: fit,
      placeholderFadeInDuration: Duration.zero,
    );
  }
}

OctoPlaceholderBuilder _blurHashPlaceholderBuilder(
  String? thumbHash, {
  BoxFit? fit,
}) {
  return (context) => thumbHash == null
      ? const ThumbnailPlaceholder()
      : FadeInPlaceholderImage(
          placeholder: const ThumbnailPlaceholder(),
          image: ThumbHashProvider(thumbHash: thumbHash),
          fit: fit ?? BoxFit.cover,
        );
}

OctoErrorBuilder _blurHashErrorBuilder(
  String? blurhash, {
  BaseAsset? asset,
  ImageProvider? provider,
  BoxFit? fit,
}) =>
    (context, e, s) {
      Logger("ImThumbnail")
          .warning("Error loading thumbnail for ${asset?.name}", e, s);
      provider?.evict();
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

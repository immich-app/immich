import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumb_hash_provider.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_placeholder.dart';
import 'package:immich_mobile/widgets/common/fade_in_placeholder_image.dart';
import 'package:logging/logging.dart';
import 'package:octo_image/octo_image.dart';

class Thumbnail extends StatefulWidget {
  const Thumbnail({this.asset, this.remoteId, this.size = kTimelineFixedTileExtent, this.fit = BoxFit.cover, super.key})
    : assert(asset != null || remoteId != null, 'Either asset or remoteId must be provided');

  final BaseAsset? asset;
  final String? remoteId;
  final Size size;
  final BoxFit fit;

  @override
  createState() => _ThumbnailState();
}

class _ThumbnailState extends State<Thumbnail> {
  ImageProvider? provider;

  @override
  void initState() {
    provider = getThumbnailImageProvider(asset: widget.asset, remoteId: widget.remoteId);
    super.initState();
  }

  @override
  void didUpdateWidget(covariant Thumbnail oldWidget) {
    if (oldWidget.asset == widget.asset && oldWidget.remoteId == widget.remoteId) {
      return;
    }
    if (provider is CancellableImageProvider) {
      (provider as CancellableImageProvider).cancel();
    }
    provider = getThumbnailImageProvider(asset: widget.asset, remoteId: widget.remoteId);
    super.didUpdateWidget(oldWidget);
  }

  @override
  Widget build(BuildContext context) {
    final thumbHash = widget.asset is RemoteAsset ? (widget.asset as RemoteAsset).thumbHash : null;

    return OctoImage.fromSet(
      image: provider!,
      octoSet: OctoSet(
        placeholderBuilder: _blurHashPlaceholderBuilder(thumbHash),
        errorBuilder: _blurHashErrorBuilder(thumbHash, provider: provider, asset: widget.asset),
      ),
      fadeOutDuration: const Duration(milliseconds: 100),
      fadeInDuration: Duration.zero,
      width: widget.size.width,
      height: widget.size.height,
      fit: widget.fit,
      placeholderFadeInDuration: Duration.zero,
    );
  }

  @override
  void dispose() {
    if (provider is CancellableImageProvider) {
      (provider as CancellableImageProvider).cancel();
    }
    super.dispose();
  }

  OctoPlaceholderBuilder _blurHashPlaceholderBuilder(String? thumbHash) {
    return (context) => thumbHash == null
        ? const ThumbnailPlaceholder()
        : FadeInPlaceholderImage(
            placeholder: const ThumbnailPlaceholder(),
            image: ThumbHashProvider(thumbHash: thumbHash),
            fit: widget.fit,
            width: widget.size.width,
            height: widget.size.height,
          );
  }

  OctoErrorBuilder _blurHashErrorBuilder(String? blurhash, {BaseAsset? asset, ImageProvider? provider}) =>
      (context, e, s) {
        Logger("ImThumbnail").warning("Error loading thumbnail for ${asset?.name}", e, s);
        return Stack(
          alignment: Alignment.center,
          children: [
            _blurHashPlaceholderBuilder(blurhash)(context),
            const Opacity(opacity: 0.75, child: Icon(Icons.error_outline_rounded)),
          ],
        );
      };
}

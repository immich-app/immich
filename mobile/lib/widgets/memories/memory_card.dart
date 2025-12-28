import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/pages/common/native_video_viewer.page.dart';
import 'package:immich_mobile/utils/hooks/blurhash_hook.dart';
import 'package:immich_mobile/widgets/common/immich_image.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';

class MemoryCard extends StatelessWidget {
  final Asset asset;
  final String title;
  final bool showTitle;
  final Function()? onVideoEnded;
  final ValueChanged<bool>? onZoomChanged;

  const MemoryCard({
    required this.asset,
    required this.title,
    required this.showTitle,
    this.onVideoEnded,
    this.onZoomChanged,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.black,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(25.0)),
        side: BorderSide(color: Colors.black, width: 1.0),
      ),
      clipBehavior: Clip.hardEdge,
      child: Stack(
        children: [
          SizedBox.expand(child: _BlurredBackdrop(asset: asset)),
          LayoutBuilder(
            builder: (context, constraints) {
              if (asset.isImage) {
                return Hero(
                  tag: 'memory-${asset.id}',
                  child: PhotoView(
                    key: ValueKey('photo-${asset.id}'),
                    imageProvider: ImmichImage.imageProvider(
                      asset: asset,
                      width: constraints.maxWidth,
                      height: constraints.maxHeight,
                    ),
                    index: 0,
                    minScale: PhotoViewComputedScale.contained,
                    maxScale: PhotoViewComputedScale.covered * 5,
                    initialScale: PhotoViewComputedScale.contained,
                    backgroundDecoration: const BoxDecoration(color: Colors.transparent),
                    filterQuality: FilterQuality.high,
                    scaleStateChangedCallback: (scaleState) {
                      final isZoomed = scaleState != PhotoViewScaleState.initial;
                      onZoomChanged?.call(isZoomed);
                    },
                  ),
                );
              } else {
                return Hero(
                  tag: 'memory-${asset.id}',
                  child: SizedBox(
                    width: context.width,
                    height: context.height,
                    child: NativeVideoViewerPage(
                      key: ValueKey(asset.id),
                      asset: asset,
                      showControls: false,
                      playbackDelayFactor: 2,
                      image: ImmichImage(asset, width: context.width, height: context.height, fit: BoxFit.contain),
                    ),
                  ),
                );
              }
            },
          ),
          if (showTitle)
            Positioned(
              left: 18.0,
              bottom: 18.0,
              child: Text(
                title,
                style: context.textTheme.headlineMedium?.copyWith(color: Colors.white, fontWeight: FontWeight.w500),
              ),
            ),
        ],
      ),
    );
  }
}

class _BlurredBackdrop extends HookWidget {
  final Asset asset;

  const _BlurredBackdrop({required this.asset});

  @override
  Widget build(BuildContext context) {
    final blurhash = useBlurHashRef(asset).value;
    if (blurhash != null) {
      // Use a nice cheap blur hash image decoration
      return Container(
        decoration: BoxDecoration(
          image: DecorationImage(image: MemoryImage(blurhash), fit: BoxFit.cover),
        ),
        child: Container(color: Colors.black.withValues(alpha: 0.2)),
      );
    } else {
      // Fall back to using a more expensive image filtered
      // Since the ImmichImage is already precached, we can
      // safely use that as the image provider
      return ImageFiltered(
        imageFilter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
        child: Container(
          decoration: BoxDecoration(
            image: DecorationImage(
              image: ImmichImage.imageProvider(asset: asset, height: context.height, width: context.width),
              fit: BoxFit.cover,
            ),
          ),
          child: Container(color: Colors.black.withValues(alpha: 0.2)),
        ),
      );
    }
  }
}

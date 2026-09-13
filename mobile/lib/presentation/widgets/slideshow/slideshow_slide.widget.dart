import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/video_viewer.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';

void _noop() {}

/// A single slideshow slide
class SlideshowSlide extends StatelessWidget {
  static const double _kenBurnsZoomMultiplier = 0.1;

  final BaseAsset asset;

  final int index;
  final SlideshowLook look;
  final Animation<double> zoom;

  final bool isCurrent;
  final bool frozen;

  final VoidCallback onTapUp;
  final VoidCallback onCompleted;

  const SlideshowSlide({
    super.key,
    required this.asset,
    required this.index,
    required this.look,
    required this.zoom,
    required this.isCurrent,
    required this.onTapUp,
    required this.onCompleted,
  }) : frozen = false;

  /// A static slide frozen at a given zoom level for use transitions
  SlideshowSlide.frozen({super.key, required this.asset, required this.index, required this.look, required double zoom})
    : zoom = AlwaysStoppedAnimation(zoom),
      isCurrent = false,
      frozen = true,
      onTapUp = _noop,
      onCompleted = _noop;

  PhotoViewComputedScale get _scale =>
      look == SlideshowLook.cover ? PhotoViewComputedScale.covered : PhotoViewComputedScale.contained;

  @override
  Widget build(BuildContext context) {
    final Widget content = asset.isImage || frozen
        ? ScaleTransition(
            scale: zoom.drive(Tween(begin: 1.0, end: 1.0 + _kenBurnsZoomMultiplier)),
            child: PhotoView(
              imageProvider: getFullImageProvider(asset, size: context.sizeData),
              index: index,
              disableScaleGestures: true,
              gaplessPlayback: true,
              filterQuality: FilterQuality.high,
              initialScale: _scale,
              controller: PhotoViewController(),
              onTapUp: (_, _, _) => onTapUp(),
            ),
          )
        : _SlideshowVideo(
            asset: asset,
            isCurrent: isCurrent,
            scale: _scale,
            imageProvider: getFullImageProvider(asset, size: context.sizeData),
            onTapUp: onTapUp,
            onCompleted: onCompleted,
          );

    return Stack(
      fit: StackFit.expand,
      children: [
        if (look == SlideshowLook.blurredBackground) _BlurredBackground(asset: asset),
        content,
      ],
    );
  }
}

class _BlurredBackground extends StatelessWidget {
  final BaseAsset asset;

  const _BlurredBackground({required this.asset});

  @override
  Widget build(BuildContext context) {
    return ImageFiltered(
      imageFilter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
      child: DecoratedBox(
        decoration: BoxDecoration(
          image: DecorationImage(
            image: getFullImageProvider(asset, size: Size(context.width, context.height)),
            fit: BoxFit.cover,
          ),
        ),
        child: Container(color: Colors.black.withValues(alpha: 0.2)),
      ),
    );
  }
}

class _SlideshowVideo extends ConsumerWidget {
  final BaseAsset asset;

  final bool isCurrent;
  final PhotoViewComputedScale scale;

  final ImageProvider imageProvider;

  final VoidCallback onTapUp;
  final VoidCallback onCompleted;

  const _SlideshowVideo({
    required this.asset,
    required this.isCurrent,
    required this.scale,
    required this.imageProvider,
    required this.onTapUp,
    required this.onCompleted,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(videoPlayerProvider(asset.id).select((s) => s.status), (_, status) {
      if (status == VideoPlaybackStatus.completed) {
        if (isCurrent && ref.read(videoPlayerProvider(asset.id)).position.inMicroseconds > 0) {
          onCompleted();
        }
      }
    });

    return PhotoView.customChild(
      onTapUp: (_, _, _) => onTapUp(),
      disableScaleGestures: true,
      filterQuality: FilterQuality.high,
      initialScale: scale,
      child: NativeVideoViewer(
        asset: asset,
        isCurrent: isCurrent,
        // Disable video looping
        loopOverride: false,
        image: Image(image: imageProvider, fit: BoxFit.contain, alignment: Alignment.center),
      ),
    );
  }
}

import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/shared/ui/hooks/blurhash_hook.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';

class MemoryCard extends StatelessWidget {
  final Asset asset;
  final String title;
  final bool showTitle;
  final Function()? onVideoEnded;

  const MemoryCard({
    required this.asset,
    required this.title,
    required this.showTitle,
    this.onVideoEnded,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.black,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(25.0),
        side: const BorderSide(
          color: Colors.black,
          width: 1.0,
        ),
      ),
      clipBehavior: Clip.hardEdge,
      child: Stack(
        children: [
          SizedBox.expand(
            child: _BlurredBackdrop(asset: asset),
          ),
          LayoutBuilder(
            builder: (context, constraints) {
              // Determine the fit using the aspect ratio
              BoxFit fit = BoxFit.contain;
              if (asset.width != null && asset.height != null) {
                final aspectRatio = asset.width! / asset.height!;
                final phoneAspectRatio =
                    constraints.maxWidth / constraints.maxHeight;
                // Look for a 25% difference in either direction
                if (phoneAspectRatio * .75 < aspectRatio &&
                    phoneAspectRatio * 1.25 > aspectRatio) {
                  // Cover to look nice if we have nearly the same aspect ratio
                  fit = BoxFit.cover;
                }
              }

              if (asset.isImage) {
                return Hero(
                  tag: 'memory-${asset.id}',
                  child: ImmichImage(
                    asset,
                    fit: fit,
                    height: double.infinity,
                    width: double.infinity,
                  ),
                );
              } else {
                return Hero(
                  tag: 'memory-${asset.id}',
                  child: VideoViewerPage(
                    key: ValueKey(asset),
                    asset: asset,
                    showDownloadingIndicator: false,
                    placeholder: SizedBox.expand(
                      child: ImmichImage(
                        asset,
                        fit: fit,
                      ),
                    ),
                    hideControlsTimer: const Duration(seconds: 2),
                    showControls: false,
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
                style: context.textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w500,
                ),
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
          image: DecorationImage(
            image: MemoryImage(
              blurhash,
            ),
            fit: BoxFit.cover,
          ),
        ),
        child: Container(
          color: Colors.black.withOpacity(0.2),
        ),
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
              image: ImmichImage.imageProvider(
                asset: asset,
              ),
              fit: BoxFit.cover,
            ),
          ),
          child: Container(
            color: Colors.black.withOpacity(0.2),
          ),
        ),
      );
    }
  }
}

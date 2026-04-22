import 'dart:ui';

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/video_viewer.widget.dart';

/// A card widget for the swipe curation stack.
/// Renders a photo using Immich's Thumbnail system with
/// swipe-direction overlay, favorite icon, and video badge.
class SwipeCard extends StatelessWidget {
  final RemoteAsset asset;
  final bool isBackground;
  final bool isFavorited;
  final Offset swipeOffset;
  final VoidCallback? onDoubleTap;
  final VoidCallback? onFavoriteTap;

  const SwipeCard({
    super.key,
    required this.asset,
    this.isBackground = false,
    this.isFavorited = false,
    this.swipeOffset = Offset.zero,
    this.onDoubleTap,
    this.onFavoriteTap,
  });

  String _formatDuration(Duration d) {
    final mins = d.inMinutes;
    final secs = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$mins:$secs';
  }

  @override
  Widget build(BuildContext context) {
    final double aspectRatio = 
        (asset.width ?? 1) / math.max((asset.height ?? 1), 1);

    return GestureDetector(
      onDoubleTap: isBackground ? null : onDoubleTap,
      child: Center(
        child: AspectRatio(
          aspectRatio: aspectRatio,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Photo thumbnail or Video Viewer
                if (asset.isVideo && !isBackground)
                  NativeVideoViewer(
                    asset: asset,
                    isCurrent: true,
                    showControls: false,
                    image: Thumbnail.fromAsset(
                      asset: asset,
                      fit: BoxFit.cover,
                      size: const Size(900, 900),
                    ),
                  )
                else
                  Thumbnail.fromAsset(
                    asset: asset,
                    fit: BoxFit.cover,
                    size: const Size(900, 900),
                  ),

              // Background blur overlay for non-top cards
              if (isBackground)
                Positioned.fill(
                  child: ClipRect(
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
                      child: Container(
                        color: Colors.black.withValues(alpha: 0.35),
                      ),
                    ),
                  ),
                ),

              // Video duration badge
              if (asset.isVideo)
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.play_arrow_rounded,
                            size: 14, color: Colors.white),
                        const SizedBox(width: 4),
                        Text(
                          _formatDuration(asset.duration),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Favorite heart icon (top-right for Immich style)
              if (!isBackground)
                Positioned(
                  top: asset.isVideo ? 38 : 12,
                  right: 12,
                  child: GestureDetector(
                    onTap: onFavoriteTap,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.4),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isFavorited
                            ? Icons.favorite_rounded
                            : Icons.favorite_border_rounded,
                        size: 22,
                        color: isFavorited ? Colors.red : Colors.white,
                      ),
                    ),
                  ),
                ),

              // Swipe direction overlay
              if (!isBackground && swipeOffset.dx.abs() > 10)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      color: swipeOffset.dx > 0
                          ? Color.fromRGBO(76, 175, 80,
                              (swipeOffset.dx.abs() / 150).clamp(0.0, 0.55))
                          : Color.fromRGBO(244, 67, 54,
                              (swipeOffset.dx.abs() / 150).clamp(0.0, 0.55)),
                    ),
                    child: Center(
                      child: Opacity(
                        opacity:
                            ((swipeOffset.dx.abs() - 30) / 80).clamp(0.0, 1.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              swipeOffset.dx > 0
                                  ? Icons.check_circle_outline_rounded
                                  : Icons.delete_outline_rounded,
                              size: 48,
                              color: Colors.white,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              swipeOffset.dx > 0 ? 'KEEP' : 'TRASH',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 3,
                                shadows: [
                                  Shadow(
                                      blurRadius: 12,
                                      color: Color(0x66000000)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

              // Bottom hint
              if (!isBackground)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.5),
                          Colors.black.withValues(alpha: 0.0),
                        ],
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.swipe_rounded,
                            size: 14,
                            color: Colors.white.withValues(alpha: 0.6)),
                        const SizedBox(width: 6),
                        Text(
                          '← Trash  •  Keep →',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.white.withValues(alpha: 0.6),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Card border
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: context.colorScheme.outline.withValues(alpha: 0.1),
                      width: 0.5,
                    ),
                  ),
                ),
              ),
            ],
            ),
          ),
        ),
      ),
    );
  }
}

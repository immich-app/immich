import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

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

  String get accessToken => Store.get(StoreKey.accessToken);

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
          ImageFiltered(
            imageFilter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
            child: Container(
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: CachedNetworkImageProvider(
                    getThumbnailUrl(
                      asset,
                    ),
                    cacheKey: getThumbnailCacheKey(
                      asset,
                    ),
                    headers: {"x-immich-user-token": accessToken},
                  ),
                  fit: BoxFit.cover,
                ),
              ),
              child: Container(color: Colors.black.withOpacity(0.2)),
            ),
          ),
          LayoutBuilder(
            builder: (context, constraints) {
              // Determine the fit using the aspect ratio
              BoxFit fit = BoxFit.fitWidth;
              if (asset.width != null && asset.height != null) {
                final aspectRatio = asset.height! / asset.width!;
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
                    type: ThumbnailFormat.JPEG,
                    preferredLocalAssetSize: 2048,
                  ),
                );
              } else {
                return Hero(
                  tag: 'memory-${asset.id}',
                  child: VideoViewerPage(
                    asset: asset,
                    showDownloadingIndicator: false,
                    placeholder: ImmichImage(
                      asset,
                      fit: fit,
                      type: ThumbnailFormat.JPEG,
                      preferredLocalAssetSize: 2048,
                    ),
                    hideControlsTimer: const Duration(seconds: 2),
                    onVideoEnded: onVideoEnded,
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

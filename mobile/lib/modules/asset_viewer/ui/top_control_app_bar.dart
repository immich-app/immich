import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';

class TopControlAppBar extends HookConsumerWidget {
  const TopControlAppBar({
    Key? key,
    required this.asset,
    required this.onMoreInfoPressed,
    required this.onDownloadPressed,
    required this.onSharePressed,
    required this.onDeletePressed,
    required this.onAddToAlbumPressed,
    required this.onToggleMotionVideo,
    required this.isPlayingMotionVideo,
    required this.onFavorite,
    required this.isFavorite,
  }) : super(key: key);

  final Asset asset;
  final Function onMoreInfoPressed;
  final VoidCallback? onDownloadPressed;
  final VoidCallback onToggleMotionVideo;
  final VoidCallback onDeletePressed;
  final VoidCallback onAddToAlbumPressed;
  final VoidCallback onFavorite;
  final Function onSharePressed;
  final bool isPlayingMotionVideo;
  final bool isFavorite;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    double iconSize = 18.0;

    Widget buildFavoriteButton() {
        return IconButton(
          iconSize: iconSize,
          splashRadius: iconSize,
          onPressed: () {
            onFavorite();
          },
          icon: Icon(
            isFavorite ? Icons.star : Icons.star_border,
            color: Colors.grey[200],
          ),
        );
    }

    return AppBar(
      foregroundColor: Colors.grey[100],
      backgroundColor: Colors.transparent,
      leading: IconButton(
        onPressed: () {
          AutoRouter.of(context).pop();
        },
        icon: Icon(
          Icons.arrow_back_ios_new_rounded,
          size: 20.0,
          color: Colors.grey[200],
        ),
      ),
      actions: [
        if (asset.isRemote) buildFavoriteButton(),
        if (asset.livePhotoVideoId != null)
          IconButton(
            iconSize: iconSize,
            splashRadius: iconSize,
            onPressed: () {
              onToggleMotionVideo();
            },
            icon: isPlayingMotionVideo
                ? Icon(
                    Icons.motion_photos_pause_outlined,
                    color: Colors.grey[200],
                  )
                : Icon(
                    Icons.play_circle_outline_rounded,
                    color: Colors.grey[200],
                  ),
          ),
        if (!asset.isLocal)
          IconButton(
            iconSize: iconSize,
            splashRadius: iconSize,
            onPressed: onDownloadPressed,
            icon: Icon(
              Icons.cloud_download_rounded,
              color: Colors.grey[200],
            ),
          ),
        IconButton(
          iconSize: iconSize,
          splashRadius: iconSize,
          onPressed: () {
            onSharePressed();
          },
          icon: Icon(
            Icons.ios_share_rounded,
            color: Colors.grey[200],
          ),
        ),
        if (asset.isRemote)
          IconButton(
            iconSize: iconSize,
            splashRadius: iconSize,
            onPressed: () {
              onAddToAlbumPressed();
            },
            icon: Icon(
              Icons.add,
              color: Colors.grey[200],
            ),
          ),
        IconButton(
          iconSize: iconSize,
          splashRadius: iconSize,
          onPressed: () {
            onDeletePressed();
          },
          icon: Icon(
            Icons.delete_outline_rounded,
            color: Colors.grey[200],
          ),
        ),
        IconButton(
          iconSize: iconSize,
          splashRadius: iconSize,
          onPressed: () {
            onMoreInfoPressed();
          },
          icon: Icon(
            Icons.more_horiz_rounded,
            color: Colors.grey[200],
          ),
        ),
      ],
    );
  }
}

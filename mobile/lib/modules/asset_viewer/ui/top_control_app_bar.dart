import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/activities/providers/activity.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';

class TopControlAppBar extends HookConsumerWidget {
  const TopControlAppBar({
    Key? key,
    required this.asset,
    required this.onMoreInfoPressed,
    required this.onDownloadPressed,
    required this.onAddToAlbumPressed,
    required this.onToggleMotionVideo,
    required this.isPlayingMotionVideo,
    required this.onFavorite,
    required this.onUploadPressed,
    required this.isOwner,
    required this.shareAlbumId,
    required this.onActivitiesPressed,
  }) : super(key: key);

  final Asset asset;
  final Function onMoreInfoPressed;
  final VoidCallback? onUploadPressed;
  final VoidCallback? onDownloadPressed;
  final VoidCallback onToggleMotionVideo;
  final VoidCallback onAddToAlbumPressed;
  final VoidCallback onActivitiesPressed;
  final Function(Asset) onFavorite;
  final bool isPlayingMotionVideo;
  final bool isOwner;
  final String? shareAlbumId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const double iconSize = 22.0;
    final a = ref.watch(assetWatcher(asset)).value ?? asset;
    final comments = shareAlbumId != null
        ? ref.watch(
            activityStatisticsStateProvider(
              (albumId: shareAlbumId!, assetId: asset.remoteId),
            ),
          )
        : 0;

    Widget buildFavoriteButton(a) {
      return IconButton(
        onPressed: () => onFavorite(a),
        icon: Icon(
          a.isFavorite ? Icons.favorite : Icons.favorite_border,
          color: Colors.grey[200],
        ),
      );
    }

    Widget buildLivePhotoButton() {
      return IconButton(
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
      );
    }

    Widget buildMoreInfoButton() {
      return IconButton(
        onPressed: () {
          onMoreInfoPressed();
        },
        icon: Icon(
          Icons.info_outline_rounded,
          color: Colors.grey[200],
        ),
      );
    }

    Widget buildDownloadButton() {
      return IconButton(
        onPressed: onDownloadPressed,
        icon: Icon(
          Icons.cloud_download_outlined,
          color: Colors.grey[200],
        ),
      );
    }

    Widget buildAddToAlbumButtom() {
      return IconButton(
        onPressed: () {
          onAddToAlbumPressed();
        },
        icon: Icon(
          Icons.add,
          color: Colors.grey[200],
        ),
      );
    }

    Widget buildActivitiesButton() {
      return IconButton(
        onPressed: () {
          onActivitiesPressed();
        },
        icon: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              Icons.mode_comment_outlined,
              color: Colors.grey[200],
            ),
            if (comments != 0)
              Padding(
                padding: const EdgeInsets.only(left: 5),
                child: Text(
                  comments.toString(),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[200],
                  ),
                ),
              ),
          ],
        ),
      );
    }

    Widget buildUploadButton() {
      return IconButton(
        onPressed: onUploadPressed,
        icon: Icon(
          Icons.backup_outlined,
          color: Colors.grey[200],
        ),
      );
    }

    Widget buildBackButton() {
      return IconButton(
        onPressed: () {
          context.autoPop();
        },
        icon: Icon(
          Icons.arrow_back_ios_new_rounded,
          size: 20.0,
          color: Colors.grey[200],
        ),
      );
    }

    return AppBar(
      foregroundColor: Colors.grey[100],
      backgroundColor: Colors.transparent,
      leading: buildBackButton(),
      actionsIconTheme: const IconThemeData(
        size: iconSize,
      ),
      actions: [
        if (asset.isRemote && isOwner) buildFavoriteButton(a),
        if (asset.livePhotoVideoId != null) buildLivePhotoButton(),
        if (asset.isLocal && !asset.isRemote) buildUploadButton(),
        if (asset.isRemote && !asset.isLocal && isOwner) buildDownloadButton(),
        if (asset.isRemote && isOwner) buildAddToAlbumButtom(),
        if (shareAlbumId != null) buildActivitiesButton(),
        buildMoreInfoButton(),
      ],
    );
  }
}

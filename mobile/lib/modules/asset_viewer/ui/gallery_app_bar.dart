import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/current_album.provider.dart';
import 'package:immich_mobile/modules/album/ui/add_to_album_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/show_controls.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/top_control_app_bar.dart';
import 'package:immich_mobile/modules/backup/providers/manual_upload.provider.dart';
import 'package:immich_mobile/modules/trash/providers/trashed_asset.provider.dart';
import 'package:immich_mobile/modules/home/ui/upload_dialog.dart';
import 'package:immich_mobile/modules/partner/providers/partner.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';

class GalleryAppBar extends ConsumerWidget {
  final Asset asset;
  final void Function() showInfo;
  final void Function() onToggleMotionVideo;
  final bool isPlayingVideo;

  const GalleryAppBar({
    super.key,
    required this.asset,
    required this.showInfo,
    required this.onToggleMotionVideo,
    required this.isPlayingVideo,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final album = ref.watch(currentAlbumProvider);
    final isOwner = asset.ownerId == ref.watch(currentUserProvider)?.isarId;

    final isPartner = ref
        .watch(partnerSharedWithProvider)
        .map((e) => e.isarId)
        .contains(asset.ownerId);

    toggleFavorite(Asset asset) =>
        ref.read(assetProvider.notifier).toggleFavorite([asset]);

    handleActivities() {
      if (album != null && album.shared && album.remoteId != null) {
        context.pushRoute(const ActivitiesRoute());
      }
    }

    handleRestore(Asset asset) async {
      final result = await ref.read(trashProvider.notifier).restoreAsset(asset);

      if (result && context.mounted) {
        ImmichToast.show(
          context: context,
          msg: 'asset restored successfully',
          gravity: ToastGravity.BOTTOM,
        );
      }
    }

    handleUpload(Asset asset) {
      showDialog(
        context: context,
        builder: (BuildContext _) {
          return UploadDialog(
            onUpload: () {
              ref
                  .read(manualUploadProvider.notifier)
                  .uploadAssets(context, [asset]);
            },
          );
        },
      );
    }

    addToAlbum(Asset addToAlbumAsset) {
      showModalBottomSheet(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15.0),
        ),
        context: context,
        builder: (BuildContext _) {
          return AddToAlbumBottomSheet(
            assets: [addToAlbumAsset],
          );
        },
      );
    }

    return IgnorePointer(
      ignoring: !ref.watch(showControlsProvider),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 100),
        opacity: ref.watch(showControlsProvider) ? 1.0 : 0.0,
        child: Container(
          color: Colors.black.withOpacity(0.4),
          child: TopControlAppBar(
            isOwner: isOwner,
            isPartner: isPartner,
            isPlayingMotionVideo: isPlayingVideo,
            asset: asset,
            onMoreInfoPressed: showInfo,
            onFavorite: toggleFavorite,
            onRestorePressed: () => handleRestore(asset),
            onUploadPressed: asset.isLocal ? () => handleUpload(asset) : null,
            onDownloadPressed: asset.isLocal
                ? null
                : () =>
                    ref.read(imageViewerStateProvider.notifier).downloadAsset(
                          asset,
                          context,
                        ),
            onToggleMotionVideo: onToggleMotionVideo,
            onAddToAlbumPressed: () => addToAlbum(asset),
            onActivitiesPressed: handleActivities,
          ),
        ),
      ),
    );
  }
}

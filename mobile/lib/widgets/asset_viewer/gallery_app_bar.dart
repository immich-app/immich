import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/widgets/album/add_to_album_bottom_sheet.dart';
import 'package:immich_mobile/providers/asset_viewer/download.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/top_control_app_bar.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';
import 'package:immich_mobile/providers/trash.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/upload_dialog.dart';
import 'package:immich_mobile/providers/partner.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

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
    final isInAlbum = album?.isRemote ?? false;
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
          msg: 'asset_restored_successfully'.tr(),
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

    showPartnerInfo(Asset asset, User user) {
      showDialog(
        context: context,
        builder: (BuildContext _) {
          return SimpleDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            elevation: 5,
            title: Center(
              heightFactor: 0.8,
              child: Text(
                isInAlbum
                    ? "album_thumbnail_shared_by".tr(args: [""])
                    : "partner_sharing_dialog_title".tr(),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            children: [
              SimpleDialogOption(
                onPressed: () {
                  // Need to determine if we are viewing from the partner sharing view
                  // Navigator.of(context, rootNavigator: true).pop();
                  // context.pushRoute((PartnerDetailRoute(partner: user)));
                },
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    UserCircleAvatar(
                      user: user,
                      radius: 15,
                      size: 30,
                    ).build(context),
                    Padding(
                      padding: const EdgeInsetsDirectional.only(start: 16.0),
                      child: Text(
                        user.name,
                        style: const TextStyle(
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      );
    }

    handleDownloadAsset() {
      ref.read(downloadStateProvider.notifier).downloadAsset(asset, context);
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
            onDownloadPressed: asset.isLocal ? null : handleDownloadAsset,
            onToggleMotionVideo: onToggleMotionVideo,
            onAddToAlbumPressed: () => addToAlbum(asset),
            onActivitiesPressed: handleActivities,
            onPartnerPressed: showPartnerInfo,
          ),
        ),
      ),
    );
  }
}

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/download.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/scroll_to_date_notifier.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';
import 'package:immich_mobile/providers/partner.provider.dart';
import 'package:immich_mobile/providers/tab.provider.dart';
import 'package:immich_mobile/providers/trash.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/album/add_to_album_bottom_sheet.dart';
import 'package:immich_mobile/widgets/asset_grid/upload_dialog.dart';
import 'package:immich_mobile/widgets/asset_viewer/top_control_app_bar.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class GalleryAppBar extends ConsumerWidget {
  final void Function() showInfo;

  const GalleryAppBar({super.key, required this.showInfo});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetProvider);
    if (asset == null) {
      return const SizedBox();
    }
    final album = ref.watch(currentAlbumProvider);
    final isOwner = asset.ownerId == ref.watch(currentUserProvider)?.id;
    final showControls = ref.watch(showControlsProvider);

    final isPartner = ref
        .watch(partnerSharedWithProvider)
        .map((e) => e.id)
        .contains(asset.ownerId);

    toggleFavorite(Asset asset) =>
        ref.read(assetProvider.notifier).toggleFavorite([asset]);

    handleActivities() {
      if (album != null && album.shared && album.remoteId != null) {
        context.pushRoute(const ActivitiesRoute());
      }
    }

    handleRestore(Asset asset) async {
      final result =
          await ref.read(trashProvider.notifier).restoreAssets([asset]);

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

    handleDownloadAsset() {
      ref.read(downloadStateProvider.notifier).downloadAsset(asset, context);
    }

    handleLocateAsset() async {
      // Go back to the gallery
      await context.maybePop();
      await context
          .navigateTo(const TabControllerRoute(children: [PhotosRoute()]));
      ref.read(tabProvider.notifier).update((state) => state = TabEnum.home);
      // Scroll to the asset's date
      scrollToDateNotifierProvider.scrollToDate(asset.fileCreatedAt);
    }

    return IgnorePointer(
      ignoring: !showControls,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 100),
        opacity: showControls ? 1.0 : 0.0,
        child: Container(
          color: Colors.black.withValues(alpha: 0.4),
          child: TopControlAppBar(
            isOwner: isOwner,
            isPartner: isPartner,
            asset: asset,
            onMoreInfoPressed: showInfo,
            onLocatePressed: handleLocateAsset,
            onFavorite: toggleFavorite,
            onRestorePressed: () => handleRestore(asset),
            onUploadPressed: asset.isLocal ? () => handleUpload(asset) : null,
            onDownloadPressed: asset.isLocal ? null : handleDownloadAsset,
            onAddToAlbumPressed: () => addToAlbum(asset),
            onActivitiesPressed: handleActivities,
          ),
        ),
      ),
    );
  }
}

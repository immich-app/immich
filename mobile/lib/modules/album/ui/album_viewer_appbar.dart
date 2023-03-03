import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/providers/album_viewer.provider.dart';
import 'package:immich_mobile/modules/album/providers/asset_selection.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/shared/views/immich_loading_overlay.dart';

class AlbumViewerAppbar extends HookConsumerWidget with PreferredSizeWidget {
  const AlbumViewerAppbar({
    Key? key,
    required this.album,
    required this.userId,
  }) : super(key: key);

  final Album album;
  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isMultiSelectionEnable =
        ref.watch(assetSelectionProvider).isMultiselectEnable;
    final selectedAssetsInAlbum =
        ref.watch(assetSelectionProvider).selectedAssetsInAlbumViewer;
    final newAlbumTitle = ref.watch(albumViewerProvider).editTitleText;
    final isEditAlbum = ref.watch(albumViewerProvider).isEditAlbum;

    void onDeleteAlbumPressed() async {
      ImmichLoadingOverlayController.appLoader.show();

      final bool success;
      if (album.shared) {
        success =
            await ref.watch(sharedAlbumProvider.notifier).deleteAlbum(album);
        AutoRouter.of(context)
            .navigate(const TabControllerRoute(children: [SharingRoute()]));
      } else {
        success = await ref.watch(albumProvider.notifier).deleteAlbum(album);
        AutoRouter.of(context)
            .navigate(const TabControllerRoute(children: [LibraryRoute()]));
      }
      if (!success) {
        ImmichToast.show(
          context: context,
          msg: "album_viewer_appbar_share_err_delete".tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.BOTTOM,
        );
      }

      ImmichLoadingOverlayController.appLoader.hide();
    }

    void onLeaveAlbumPressed() async {
      ImmichLoadingOverlayController.appLoader.show();

      bool isSuccess =
          await ref.watch(sharedAlbumProvider.notifier).leaveAlbum(album);

      if (isSuccess) {
        AutoRouter.of(context)
            .navigate(const TabControllerRoute(children: [SharingRoute()]));
      } else {
        Navigator.pop(context);
        ImmichToast.show(
          context: context,
          msg: "album_viewer_appbar_share_err_leave".tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.BOTTOM,
        );
      }

      ImmichLoadingOverlayController.appLoader.hide();
    }

    void onRemoveFromAlbumPressed() async {
      ImmichLoadingOverlayController.appLoader.show();

      bool isSuccess =
          await ref.watch(sharedAlbumProvider.notifier).removeAssetFromAlbum(
                album,
                selectedAssetsInAlbum,
              );

      if (isSuccess) {
        Navigator.pop(context);
        ref.watch(assetSelectionProvider.notifier).disableMultiselection();
        ref.watch(albumProvider.notifier).getAllAlbums();
        ref.invalidate(sharedAlbumDetailProvider(album.id));
      } else {
        Navigator.pop(context);
        ImmichToast.show(
          context: context,
          msg: "album_viewer_appbar_share_err_remove".tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.BOTTOM,
        );
      }

      ImmichLoadingOverlayController.appLoader.hide();
    }

    buildBottomSheetActionButton() {
      if (isMultiSelectionEnable) {
        if (album.ownerId == userId) {
          return ListTile(
            leading: const Icon(Icons.delete_sweep_rounded),
            title: const Text(
              'album_viewer_appbar_share_remove',
              style: TextStyle(fontWeight: FontWeight.bold),
            ).tr(),
            onTap: () => onRemoveFromAlbumPressed(),
          );
        } else {
          return const SizedBox();
        }
      } else {
        if (album.ownerId == userId) {
          return ListTile(
            leading: const Icon(Icons.delete_forever_rounded),
            title: const Text(
              'album_viewer_appbar_share_delete',
              style: TextStyle(fontWeight: FontWeight.bold),
            ).tr(),
            onTap: () => onDeleteAlbumPressed(),
          );
        } else {
          return ListTile(
            leading: const Icon(Icons.person_remove_rounded),
            title: const Text(
              'album_viewer_appbar_share_leave',
              style: TextStyle(fontWeight: FontWeight.bold),
            ).tr(),
            onTap: () => onLeaveAlbumPressed(),
          );
        }
      }
    }

    void buildBottomSheet() {
      showModalBottomSheet(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        isScrollControlled: false,
        context: context,
        builder: (context) {
          return SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                buildBottomSheetActionButton(),
              ],
            ),
          );
        },
      );
    }

    buildLeadingButton() {
      if (isMultiSelectionEnable) {
        return IconButton(
          onPressed: () => ref
              .watch(assetSelectionProvider.notifier)
              .disableMultiselection(),
          icon: const Icon(Icons.close_rounded),
          splashRadius: 25,
        );
      } else if (isEditAlbum) {
        return IconButton(
          onPressed: () async {
            bool isSuccess = await ref
                .watch(albumViewerProvider.notifier)
                .changeAlbumTitle(album, newAlbumTitle);

            if (!isSuccess) {
              ImmichToast.show(
                context: context,
                msg: "album_viewer_appbar_share_err_title".tr(),
                gravity: ToastGravity.BOTTOM,
                toastType: ToastType.error,
              );
            }
          },
          icon: const Icon(Icons.check_rounded),
          splashRadius: 25,
        );
      } else {
        return IconButton(
          onPressed: () async => await AutoRouter.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
          splashRadius: 25,
        );
      }
    }

    return AppBar(
      elevation: 0,
      leading: buildLeadingButton(),
      title: isMultiSelectionEnable
          ? Text('${selectedAssetsInAlbum.length}')
          : null,
      centerTitle: false,
      actions: [
        if (album.isRemote)
          IconButton(
            splashRadius: 25,
            onPressed: buildBottomSheet,
            icon: const Icon(Icons.more_horiz_rounded),
          ),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

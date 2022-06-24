import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/immich_colors.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/modules/sharing/providers/album_viewer.provider.dart';
import 'package:immich_mobile/modules/sharing/providers/asset_selection.provider.dart';
import 'package:immich_mobile/modules/sharing/providers/shared_album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/shared/views/immich_loading_overlay.dart';

class AlbumViewerAppbar extends HookConsumerWidget with PreferredSizeWidget {
  const AlbumViewerAppbar({
    Key? key,
    required AsyncValue<SharedAlbum> albumInfo,
    required this.userId,
    required this.albumId,
  })  : _albumInfo = albumInfo,
        super(key: key);

  final AsyncValue<SharedAlbum> _albumInfo;
  final String userId;
  final String albumId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isMultiSelectionEnable =
        ref.watch(assetSelectionProvider).isMultiselectEnable;
    final selectedAssetsInAlbum =
        ref.watch(assetSelectionProvider).selectedAssetsInAlbumViewer;
    final newAlbumTitle = ref.watch(albumViewerProvider).editTitleText;
    final isEditAlbum = ref.watch(albumViewerProvider).isEditAlbum;

    void _onDeleteAlbumPressed(String albumId) async {
      ImmichLoadingOverlayController.appLoader.show();

      bool isSuccess =
          await ref.watch(sharedAlbumProvider.notifier).deleteAlbum(albumId);

      if (isSuccess) {
        AutoRouter.of(context)
            .navigate(const TabControllerRoute(children: [SharingRoute()]));
      } else {
        ImmichToast.show(
          context: context,
          msg: "Failed to delete album",
          toastType: ToastType.error,
          gravity: ToastGravity.BOTTOM,
        );
      }

      ImmichLoadingOverlayController.appLoader.hide();
    }

    void _onLeaveAlbumPressed(String albumId) async {
      ImmichLoadingOverlayController.appLoader.show();

      bool isSuccess =
          await ref.watch(sharedAlbumProvider.notifier).leaveAlbum(albumId);

      if (isSuccess) {
        AutoRouter.of(context)
            .navigate(const TabControllerRoute(children: [SharingRoute()]));
      } else {
        Navigator.pop(context);
        ImmichToast.show(
          context: context,
          msg: "Failed to leave album",
          toastType: ToastType.error,
          gravity: ToastGravity.BOTTOM,
        );
      }

      ImmichLoadingOverlayController.appLoader.hide();
    }

    void _onRemoveFromAlbumPressed(String albumId) async {
      ImmichLoadingOverlayController.appLoader.show();

      bool isSuccess =
          await ref.watch(sharedAlbumProvider.notifier).removeAssetFromAlbum(
                albumId,
                selectedAssetsInAlbum.map((a) => a.id).toList(),
              );

      if (isSuccess) {
        Navigator.pop(context);
        ref.watch(assetSelectionProvider.notifier).disableMultiselection();
        ref.refresh(sharedAlbumDetailProvider(albumId));
      } else {
        Navigator.pop(context);
        ImmichToast.show(
          context: context,
          msg: "There are problems in removing assets from album",
          toastType: ToastType.error,
          gravity: ToastGravity.BOTTOM,
        );
      }

      ImmichLoadingOverlayController.appLoader.hide();
    }

    _buildBottomSheetActionButton() {
      if (isMultiSelectionEnable) {
        if (_albumInfo.asData?.value.ownerId == userId) {
          return ListTile(
            leading: const Icon(Icons.delete_sweep_rounded),
            title: const Text(
              'Remove from album',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            onTap: () => _onRemoveFromAlbumPressed(albumId),
          );
        } else {
          return Container();
        }
      } else {
        if (_albumInfo.asData?.value.ownerId == userId) {
          return ListTile(
            leading: const Icon(Icons.delete_forever_rounded),
            title: const Text(
              'Delete album',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            onTap: () => _onDeleteAlbumPressed(albumId),
          );
        } else {
          return ListTile(
            leading: const Icon(Icons.person_remove_rounded),
            title: const Text(
              'Leave album',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            onTap: () => _onLeaveAlbumPressed(albumId),
          );
        }
      }
    }

    void _buildBottomSheet() {
      showModalBottomSheet(
        backgroundColor: immichBackgroundColor,
        isScrollControlled: false,
        context: context,
        builder: (context) {
          return SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildBottomSheetActionButton(),
              ],
            ),
          );
        },
      );
    }

    _buildLeadingButton() {
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
                .changeAlbumTitle(albumId, userId, newAlbumTitle);

            if (!isSuccess) {
              ImmichToast.show(
                context: context,
                msg: "Failed to change album title",
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
      leading: _buildLeadingButton(),
      title: isMultiSelectionEnable
          ? Text(selectedAssetsInAlbum.length.toString())
          : Container(),
      centerTitle: false,
      actions: [
        IconButton(
          splashRadius: 25,
          onPressed: _buildBottomSheet,
          icon: const Icon(Icons.more_horiz_rounded),
        ),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

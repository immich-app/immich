import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/providers/album_detail.provider.dart';
import 'package:immich_mobile/modules/album/providers/album_viewer.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/shared/views/immich_loading_overlay.dart';

class AlbumViewerAppbar extends HookConsumerWidget
    implements PreferredSizeWidget {
  const AlbumViewerAppbar({
    Key? key,
    required this.album,
    required this.userId,
    required this.selected,
    required this.selectionDisabled,
    required this.titleFocusNode,
    this.onAddPhotos,
    this.onAddUsers,
  }) : super(key: key);

  final Album album;
  final String userId;
  final Set<Asset> selected;
  final void Function() selectionDisabled;
  final FocusNode titleFocusNode;
  final Function(Album album)? onAddPhotos;
  final Function(Album album)? onAddUsers;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final newAlbumTitle = ref.watch(albumViewerProvider).editTitleText;
    final isEditAlbum = ref.watch(albumViewerProvider).isEditAlbum;

    deleteAlbum() async {
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

    Future<void> showConfirmationDialog() async {
      return showDialog<void>(
        context: context,
        barrierDismissible: false, // user must tap button!
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text('Delete album'),
            content: const Text(
              'Are you sure you want to delete this album from your account?',
            ),
            actions: <Widget>[
              TextButton(
                onPressed: () => Navigator.pop(context, 'Cancel'),
                child: Text(
                  'Cancel',
                  style: TextStyle(
                    color: Theme.of(context).primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.pop(context, 'Confirm');
                  deleteAlbum();
                },
                child: Text(
                  'Confirm',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).brightness == Brightness.light
                        ? Colors.red
                        : Colors.red[300],
                  ),
                ),
              ),
            ],
          );
        },
      );
    }

    void onDeleteAlbumPressed() async {
      showConfirmationDialog();
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
                selected,
              );

      if (isSuccess) {
        Navigator.pop(context);
        selectionDisabled();
        ref.watch(albumProvider.notifier).getAllAlbums();
        ref.invalidate(albumDetailProvider(album.id));
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
      if (selected.isNotEmpty) {
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
      final ownerActions = [
        ListTile(
          leading: const Icon(Icons.person_add_alt_rounded),
          onTap: () {
            Navigator.pop(context);
            onAddUsers!(album);
          },
          title: const Text(
            "album_viewer_page_share_add_users",
            style: TextStyle(fontWeight: FontWeight.bold),
          ).tr(),
        ),
        ListTile(
          leading: const Icon(Icons.settings_rounded),
          onTap: () =>
              AutoRouter.of(context).navigate(AlbumOptionsRoute(album: album)),
          title: const Text(
            "translated_text_options",
            style: TextStyle(fontWeight: FontWeight.bold),
          ).tr(),
        ),
      ];

      final commonActions = [
        ListTile(
          leading: const Icon(Icons.add_photo_alternate_outlined),
          onTap: () {
            Navigator.pop(context);
            onAddPhotos!(album);
          },
          title: const Text(
            "share_add_photos",
            style: TextStyle(fontWeight: FontWeight.bold),
          ).tr(),
        ),
      ];
      showModalBottomSheet(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        isScrollControlled: false,
        context: context,
        builder: (context) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.only(top: 24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  buildBottomSheetActionButton(),
                  if (selected.isEmpty && onAddPhotos != null) ...commonActions,
                  if (selected.isEmpty &&
                      onAddPhotos != null &&
                      userId == album.ownerId)
                    ...ownerActions,
                ],
              ),
            ),
          );
        },
      );
    }

    buildLeadingButton() {
      if (selected.isNotEmpty) {
        return IconButton(
          onPressed: selectionDisabled,
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

            titleFocusNode.unfocus();
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
      title: selected.isNotEmpty ? Text('${selected.length}') : null,
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

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/activity_statistics.provider.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/album/album_viewer.provider.dart';
import 'package:immich_mobile/utils/immich_loading_overlay.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class AlbumViewerAppbar extends HookConsumerWidget
    implements PreferredSizeWidget {
  const AlbumViewerAppbar({
    super.key,
    required this.album,
    required this.userId,
    required this.titleFocusNode,
    this.onAddPhotos,
    this.onAddUsers,
    required this.onActivities,
  });

  final Album album;
  final String userId;
  final FocusNode titleFocusNode;
  final Function(Album album)? onAddPhotos;
  final Function(Album album)? onAddUsers;
  final Function(Album album) onActivities;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final newAlbumTitle = ref.watch(albumViewerProvider).editTitleText;
    final isEditAlbum = ref.watch(albumViewerProvider).isEditAlbum;
    final isProcessing = useProcessingOverlay();
    final comments = album.shared
        ? ref.watch(activityStatisticsProvider(album.remoteId!))
        : 0;

    deleteAlbum() async {
      isProcessing.value = true;

      final bool success;
      if (album.shared) {
        success = await ref.watch(albumProvider.notifier).deleteAlbum(album);
        context.navigateTo(TabControllerRoute(children: [AlbumsRoute()]));
      } else {
        success = await ref.watch(albumProvider.notifier).deleteAlbum(album);
        context
            .navigateTo(const TabControllerRoute(children: [LibraryRoute()]));
      }
      if (!success) {
        ImmichToast.show(
          context: context,
          msg: "album_viewer_appbar_share_err_delete".tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.BOTTOM,
        );
      }

      isProcessing.value = false;
    }

    Future<void> showConfirmationDialog() async {
      return showDialog<void>(
        context: context,
        barrierDismissible: false, // user must tap button!
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text('album_viewer_appbar_share_delete').tr(),
            content: const Text('album_viewer_appbar_delete_confirm').tr(),
            actions: <Widget>[
              TextButton(
                onPressed: () => context.pop('Cancel'),
                child: Text(
                  'action_common_cancel',
                  style: TextStyle(
                    color: context.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ).tr(),
              ),
              TextButton(
                onPressed: () {
                  context.pop('Confirm');
                  deleteAlbum();
                },
                child: Text(
                  'action_common_confirm',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: context.colorScheme.error,
                  ),
                ).tr(),
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
      isProcessing.value = true;

      bool isSuccess =
          await ref.watch(albumProvider.notifier).leaveAlbum(album);

      if (isSuccess) {
        context.navigateTo(TabControllerRoute(children: [AlbumsRoute()]));
      } else {
        context.pop();
        ImmichToast.show(
          context: context,
          msg: "album_viewer_appbar_share_err_leave".tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.BOTTOM,
        );
      }

      isProcessing.value = false;
    }

    buildBottomSheetActions() {
      return [
        album.ownerId == userId
            ? ListTile(
                leading: const Icon(Icons.delete_forever_rounded),
                title: const Text(
                  'album_viewer_appbar_share_delete',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ).tr(),
                onTap: () => onDeleteAlbumPressed(),
              )
            : ListTile(
                leading: const Icon(Icons.person_remove_rounded),
                title: const Text(
                  'album_viewer_appbar_share_leave',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ).tr(),
                onTap: () => onLeaveAlbumPressed(),
              ),
      ];
      // }
    }

    void buildBottomSheet() {
      final ownerActions = [
        ListTile(
          leading: const Icon(Icons.person_add_alt_rounded),
          onTap: () {
            context.pop();
            onAddUsers!(album);
          },
          title: const Text(
            "album_viewer_page_share_add_users",
            style: TextStyle(fontWeight: FontWeight.w500),
          ).tr(),
        ),
        ListTile(
          leading: const Icon(Icons.share_rounded),
          onTap: () {
            context.pushRoute(SharedLinkEditRoute(albumId: album.remoteId));
            context.pop();
          },
          title: const Text(
            "control_bottom_app_bar_share",
            style: TextStyle(fontWeight: FontWeight.w500),
          ).tr(),
        ),
        ListTile(
          leading: const Icon(Icons.settings_rounded),
          onTap: () => context.navigateTo(AlbumOptionsRoute(album: album)),
          title: const Text(
            "translated_text_options",
            style: TextStyle(fontWeight: FontWeight.w500),
          ).tr(),
        ),
      ];

      final commonActions = [
        ListTile(
          leading: const Icon(Icons.add_photo_alternate_outlined),
          onTap: () {
            context.pop();
            onAddPhotos!(album);
          },
          title: const Text(
            "share_add_photos",
            style: TextStyle(fontWeight: FontWeight.w500),
          ).tr(),
        ),
      ];
      showModalBottomSheet(
        backgroundColor: context.scaffoldBackgroundColor,
        isScrollControlled: false,
        context: context,
        builder: (context) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.only(top: 24.0),
              child: ListView(
                shrinkWrap: true,
                children: [
                  ...buildBottomSheetActions(),
                  if (onAddPhotos != null) ...commonActions,
                  if (onAddPhotos != null && userId == album.ownerId)
                    ...ownerActions,
                ],
              ),
            ),
          );
        },
      );
    }

    Widget buildActivitiesButton() {
      return IconButton(
        onPressed: () {
          onActivities(album);
        },
        icon: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Icon(
              Icons.mode_comment_outlined,
            ),
            if (comments != 0)
              Padding(
                padding: const EdgeInsets.only(left: 5),
                child: Text(
                  comments.toString(),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: context.primaryColor,
                  ),
                ),
              ),
          ],
        ),
      );
    }

    buildLeadingButton() {
      if (isEditAlbum) {
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
          onPressed: () async => await context.maybePop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
          splashRadius: 25,
        );
      }
    }

    return AppBar(
      elevation: 0,
      leading: buildLeadingButton(),
      centerTitle: false,
      actions: [
        if (album.shared && (album.activityEnabled || comments != 0))
          buildActivitiesButton(),
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

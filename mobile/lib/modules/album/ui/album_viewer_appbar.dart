import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/models/asset_selection_page_result.model.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/providers/album_viewer.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/album/ui/album_action_outlined_button.dart';
import 'package:immich_mobile/modules/album/ui/album_viewer_editable_title.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/shared/views/immich_loading_overlay.dart';

class AlbumViewerAppbar extends HookConsumerWidget with PreferredSizeWidget {
  const AlbumViewerAppbar({
    Key? key,
    required this.album,
    required this.userId,
    required this.selected,
    required this.selectionDisabled,
    required this.titleFocusNode,
  }) : super(key: key);

  final Album album;
  final String userId;
  final Set<Asset> selected;
  final void Function() selectionDisabled;
  final FocusNode titleFocusNode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // final isMultiSelectionEnable =
    // ref.watch(assetSelectionProvider).isMultiselectEnable;
    // final selectedAssetsInAlbum =
    // ref.watch(assetSelectionProvider).selectedAssetsInAlbumViewer;
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
                selected,
              );

      if (isSuccess) {
        Navigator.pop(context);
        selectionDisabled();
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

    /// Find out if the assets in album exist on the device
    /// If they exist, add to selected asset state to show they are already selected.
    void onAddPhotosPressed(Album albumInfo) async {
      AssetSelectionPageResult? returnPayload =
          await AutoRouter.of(context).push<AssetSelectionPageResult?>(
        AssetSelectionRoute(
          existingAssets: albumInfo.assets,
          isNewAlbum: false,
        ),
      );

      if (returnPayload != null) {
        // Check if there is new assets add
        if (returnPayload.selectedAssets.isNotEmpty) {
          ImmichLoadingOverlayController.appLoader.show();

          var addAssetsResult =
              await ref.watch(albumServiceProvider).addAdditionalAssetToAlbum(
                    returnPayload.selectedAssets,
                    albumInfo,
                  );

          if (addAssetsResult != null &&
              addAssetsResult.successfullyAdded > 0) {
            ref.watch(albumProvider.notifier).getAllAlbums();
            ref.invalidate(sharedAlbumDetailProvider(album.id));
          }

          ImmichLoadingOverlayController.appLoader.hide();
        }
      }
    }

    void onAddUsersPressed(Album album) async {
      List<String>? sharedUserIds =
          await AutoRouter.of(context).push<List<String>?>(
        SelectAdditionalUserForSharingRoute(album: album),
      );

      if (sharedUserIds != null) {
        ImmichLoadingOverlayController.appLoader.show();

        var isSuccess = await ref
            .watch(albumServiceProvider)
            .addAdditionalUserToAlbum(sharedUserIds, album);

        if (isSuccess) {
          ref.invalidate(sharedAlbumDetailProvider(album.id));
        }

        ImmichLoadingOverlayController.appLoader.hide();
      }
    }

    PreferredSizeWidget buildControlButton(Album album) {
      if (!album.isRemote) {
        return PreferredSize(
          preferredSize: Size.zero,
          child: Container(),
        );
      }

      return PreferredSize(
        preferredSize: const Size(0, 56),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Theme.of(context).scaffoldBackgroundColor.withOpacity(0.0),
                Theme.of(context).scaffoldBackgroundColor,
              ],
              stops: const [
                0.1,
                0.2,
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          padding: const EdgeInsets.only(left: 16.0, top: 8, bottom: 8),
          child: SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                AlbumActionOutlinedButton(
                  iconData: Icons.add_photo_alternate_outlined,
                  onPressed: () => onAddPhotosPressed(album),
                  labelText: "share_add_photos".tr(),
                ),
                if (userId == album.ownerId)
                  AlbumActionOutlinedButton(
                    iconData: Icons.person_add_alt_rounded,
                    onPressed: () => onAddUsersPressed(album),
                    labelText: "album_viewer_page_share_add_users".tr(),
                  ),
              ],
            ),
          ),
        ),
      );
    }

    Widget buildTitle(Album album) {
      return Padding(
        padding: const EdgeInsets.only(left: 8, right: 8, top: 16),
        child: userId == album.ownerId && album.isRemote
            ? AlbumViewerEditableTitle(
                album: album,
                titleFocusNode: titleFocusNode,
              )
            : Padding(
                padding: const EdgeInsets.only(left: 8.0),
                child: Text(
                  album.name,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
      );
    }

    Widget buildAlbumDateRange(Album album) {
      final DateTime startDate = album.assets.first.fileCreatedAt;
      final DateTime endDate = album.assets.last.fileCreatedAt; //Need default.
      final String startDateText = (startDate.year == endDate.year
              ? DateFormat.MMMd()
              : DateFormat.yMMMd())
          .format(startDate);
      final String endDateText = DateFormat.yMMMd().format(endDate);

      return Padding(
        padding: EdgeInsets.only(
          left: 16.0,
          top: 8.0,
          bottom: album.shared ? 0.0 : 8.0,
        ),
        child: Text(
          "$startDateText - $endDateText",
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Colors.grey,
          ),
        ),
      );
    }

    Widget buildHeader(Album album) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          buildTitle(album),
          if (album.assets.isNotEmpty == true) buildAlbumDateRange(album),
          if (album.shared)
            SizedBox(
              height: 60,
              child: ListView.builder(
                padding: const EdgeInsets.only(left: 16),
                scrollDirection: Axis.horizontal,
                itemBuilder: ((context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: CircleAvatar(
                      backgroundColor: Colors.grey[300],
                      radius: 18,
                      child: Padding(
                        padding: const EdgeInsets.all(2.0),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(50.0),
                          child: Image.asset(
                            'assets/immich-logo-no-outline.png',
                          ),
                        ),
                      ),
                    ),
                  );
                }),
                itemCount: album.sharedUsers.length,
              ),
            ),
          const SizedBox(height: 56),
        ],
      );
    }

    return SliverAppBar(
      elevation: 0,
      leading: buildLeadingButton(),
      title: selected.isNotEmpty ? Text('${selected.length}') : null,
      centerTitle: false,
      floating: true,
      pinned: true,
      actions: [
        if (album.isRemote)
          IconButton(
            splashRadius: 25,
            onPressed: buildBottomSheet,
            icon: const Icon(Icons.more_horiz_rounded),
          ),
      ],
      bottom: buildControlButton(album),
      expandedHeight: 140 + ((album.isRemote) ? 56 : 0),
      flexibleSpace: FlexibleSpaceBar(
        collapseMode: CollapseMode.parallax,
        background: buildHeader(album),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

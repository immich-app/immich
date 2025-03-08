import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/pages/editing/edit.page.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_stack.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/download.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/stack.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/asset_grid/delete_dialog.dart';
import 'package:immich_mobile/widgets/asset_viewer/video_controls.dart';
import 'package:immich_mobile/widgets/common/immich_image.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class BottomGalleryBar extends ConsumerWidget {
  final ValueNotifier<int> assetIndex;
  final bool showStack;
  final ValueNotifier<int> stackIndex;
  final ValueNotifier<int> totalAssets;
  final PageController controller;
  final RenderList renderList;

  const BottomGalleryBar({
    super.key,
    required this.showStack,
    required this.stackIndex,
    required this.assetIndex,
    required this.controller,
    required this.totalAssets,
    required this.renderList,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetProvider);
    if (asset == null) {
      return const SizedBox();
    }
    final isOwner = asset.ownerId == ref.watch(currentUserProvider)?.id;
    final showControls = ref.watch(showControlsProvider);
    final stackId = asset.stackId;

    final stackItems = showStack && stackId != null
        ? ref.watch(assetStackStateProvider(stackId))
        : <Asset>[];
    bool isStackPrimaryAsset = asset.stackPrimaryAssetId == null;
    final navStack = AutoRouter.of(context).stackData;
    final isTrashEnabled =
        ref.watch(serverInfoProvider.select((v) => v.serverFeatures.trash));
    final isFromTrash = isTrashEnabled &&
        navStack.length > 2 &&
        navStack.elementAt(navStack.length - 2).name == TrashRoute.name;
    final isInAlbum = ref.watch(currentAlbumProvider)?.isRemote ?? false;

    void removeAssetFromStack() {
      if (stackIndex.value > 0 && showStack && stackId != null) {
        ref
            .read(assetStackStateProvider(stackId).notifier)
            .removeChild(stackIndex.value - 1);
      }
    }

    void handleDelete() async {
      Future<bool> onDelete(bool force) async {
        final isDeleted = await ref.read(assetProvider.notifier).deleteAssets(
          {asset},
          force: force,
        );
        if (isDeleted && isStackPrimaryAsset) {
          // Workaround for asset remaining in the gallery
          renderList.deleteAsset(asset);

          // `assetIndex == totalAssets.value - 1` handle the case of removing the last asset
          // to not throw the error when the next preCache index is called
          if (totalAssets.value == 1 ||
              assetIndex.value == totalAssets.value - 1) {
            // Handle only one asset
            context.maybePop();
          }

          totalAssets.value -= 1;
        }
        return isDeleted;
      }

      // Asset is trashed
      if (isTrashEnabled && !isFromTrash) {
        final isDeleted = await onDelete(false);
        if (isDeleted) {
          // Can only trash assets stored in server. Local assets are always permanently removed for now
          if (context.mounted && asset.isRemote && isStackPrimaryAsset) {
            ImmichToast.show(
              durationInSecond: 1,
              context: context,
              msg: 'Asset trashed',
              gravity: ToastGravity.BOTTOM,
            );
          }
          removeAssetFromStack();
        }
        return;
      }

      // Asset is permanently removed
      showDialog(
        context: context,
        builder: (BuildContext _) {
          return DeleteDialog(
            onDelete: () async {
              final isDeleted = await onDelete(true);
              if (isDeleted) {
                removeAssetFromStack();
              }
            },
          );
        },
      );
    }

    unStack() async {
      if (asset.stackId == null) {
        return;
      }

      await ref
          .read(stackServiceProvider)
          .deleteStack(asset.stackId!, stackItems);
    }

    void showStackActionItems() {
      showModalBottomSheet<void>(
        context: context,
        enableDrag: false,
        builder: (BuildContext ctx) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.only(top: 24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ListTile(
                    leading: const Icon(
                      Icons.filter_none_outlined,
                      size: 18,
                    ),
                    onTap: () async {
                      await unStack();
                      ctx.pop();
                      context.maybePop();
                    },
                    title: const Text(
                      "viewer_unstack",
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ).tr(),
                  ),
                ],
              ),
            ),
          );
        },
      );
    }

    shareAsset() {
      if (asset.isOffline) {
        ImmichToast.show(
          durationInSecond: 1,
          context: context,
          msg: 'asset_action_share_err_offline'.tr(),
          gravity: ToastGravity.BOTTOM,
        );
        return;
      }
      ref.read(downloadStateProvider.notifier).shareAsset(asset, context);
    }

    void handleEdit() async {
      final image = Image(image: ImmichImage.imageProvider(asset: asset));

      context.navigator.push(
        MaterialPageRoute(
          builder: (context) => EditImagePage(
            asset: asset,
            image: image,
            isEdited: false,
          ),
        ),
      );
    }

    handleArchive() {
      ref.read(assetProvider.notifier).toggleArchive([asset]);
      if (isStackPrimaryAsset) {
        context.maybePop();
        return;
      }
      removeAssetFromStack();
    }

    handleDownload() {
      if (asset.isLocal) {
        return;
      }
      if (asset.isOffline) {
        ImmichToast.show(
          durationInSecond: 1,
          context: context,
          msg: 'asset_action_share_err_offline'.tr(),
          gravity: ToastGravity.BOTTOM,
        );
        return;
      }

      ref.read(downloadStateProvider.notifier).downloadAsset(
            asset,
            context,
          );
    }

    handleRemoveFromAlbum() async {
      final album = ref.read(currentAlbumProvider);
      final bool isSuccess = album != null &&
          await ref.read(albumProvider.notifier).removeAsset(album, [asset]);

      if (isSuccess) {
        // Workaround for asset remaining in the gallery
        renderList.deleteAsset(asset);

        if (totalAssets.value == 1) {
          // Handle empty viewer
          await context.maybePop();
        } else {
          // changing this also for the last asset causes the parent to rebuild with an error
          totalAssets.value -= 1;
        }
        if (assetIndex.value == totalAssets.value && assetIndex.value > 0) {
          // handle the case of removing the last asset in the list
          assetIndex.value -= 1;
        }
      } else {
        ImmichToast.show(
          context: context,
          msg: "album_viewer_appbar_share_err_remove".tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.BOTTOM,
        );
      }
    }

    final List<Map<BottomNavigationBarItem, Function(int)>> albumActions = [
      {
        BottomNavigationBarItem(
          icon: Icon(
            Platform.isAndroid ? Icons.share_rounded : Icons.ios_share_rounded,
          ),
          label: 'control_bottom_app_bar_share'.tr(),
          tooltip: 'control_bottom_app_bar_share'.tr(),
        ): (_) => shareAsset(),
      },
      if (asset.isImage)
        {
          BottomNavigationBarItem(
            icon: const Icon(Icons.tune_outlined),
            label: 'control_bottom_app_bar_edit'.tr(),
            tooltip: 'control_bottom_app_bar_edit'.tr(),
          ): (_) => handleEdit(),
        },
      if (isOwner)
        {
          asset.isArchived
              ? BottomNavigationBarItem(
                  icon: const Icon(Icons.unarchive_rounded),
                  label: 'control_bottom_app_bar_unarchive'.tr(),
                  tooltip: 'control_bottom_app_bar_unarchive'.tr(),
                )
              : BottomNavigationBarItem(
                  icon: const Icon(Icons.archive_outlined),
                  label: 'control_bottom_app_bar_archive'.tr(),
                  tooltip: 'control_bottom_app_bar_archive'.tr(),
                ): (_) => handleArchive(),
        },
      if (isOwner && asset.stackCount > 0)
        {
          BottomNavigationBarItem(
            icon: const Icon(Icons.burst_mode_outlined),
            label: 'control_bottom_app_bar_stack'.tr(),
            tooltip: 'control_bottom_app_bar_stack'.tr(),
          ): (_) => showStackActionItems(),
        },
      if (isOwner && !isInAlbum)
        {
          BottomNavigationBarItem(
            icon: const Icon(Icons.delete_outline),
            label: 'control_bottom_app_bar_delete'.tr(),
            tooltip: 'control_bottom_app_bar_delete'.tr(),
          ): (_) => handleDelete(),
        },
      if (!isOwner)
        {
          BottomNavigationBarItem(
            icon: const Icon(Icons.download_outlined),
            label: 'control_bottom_app_bar_download'.tr(),
            tooltip: 'control_bottom_app_bar_download'.tr(),
          ): (_) => handleDownload(),
        },
      if (isInAlbum)
        {
          BottomNavigationBarItem(
            icon: const Icon(Icons.remove_circle_outline),
            label: 'album_viewer_appbar_share_remove'.tr(),
            tooltip: 'album_viewer_appbar_share_remove'.tr(),
          ): (_) => handleRemoveFromAlbum(),
        },
    ];
    return IgnorePointer(
      ignoring: !showControls,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 100),
        opacity: showControls ? 1.0 : 0.0,
        child: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
              colors: [Colors.black, Colors.transparent],
            ),
          ),
          position: DecorationPosition.background,
          child: Padding(
            padding: const EdgeInsets.only(top: 40.0),
            child: Column(
              children: [
                if (asset.isVideo) const VideoControls(),
                BottomNavigationBar(
                  elevation: 0.0,
                  backgroundColor: Colors.transparent,
                  unselectedIconTheme: const IconThemeData(color: Colors.white),
                  selectedIconTheme: const IconThemeData(color: Colors.white),
                  unselectedLabelStyle: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                    height: 2.3,
                  ),
                  selectedLabelStyle: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                    height: 2.3,
                  ),
                  unselectedFontSize: 14,
                  selectedFontSize: 14,
                  selectedItemColor: Colors.white,
                  unselectedItemColor: Colors.white,
                  showSelectedLabels: true,
                  showUnselectedLabels: true,
                  items: albumActions
                      .map((e) => e.keys.first)
                      .toList(growable: false),
                  onTap: (index) {
                    albumActions[index].values.first.call(index);
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

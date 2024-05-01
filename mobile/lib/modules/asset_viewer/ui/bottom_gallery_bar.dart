import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/asset_stack.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/show_controls.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/services/asset_stack.service.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/video_controls.dart';
import 'package:immich_mobile/modules/home/ui/delete_dialog.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';

class BottomGalleryBar extends ConsumerWidget {
  final Asset asset;
  final bool showStack;
  final int stackIndex;
  final int totalAssets;
  final bool showVideoPlayerControls;
  final PageController controller;

  const BottomGalleryBar({
    super.key,
    required this.showStack,
    required this.stackIndex,
    required this.asset,
    required this.controller,
    required this.totalAssets,
    required this.showVideoPlayerControls,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOwner = asset.ownerId == ref.watch(currentUserProvider)?.isarId;

    final stack = showStack && asset.stackChildrenCount > 0
        ? ref.watch(assetStackStateProvider(asset))
        : <Asset>[];
    final stackElements = showStack ? [asset, ...stack] : <Asset>[];
    bool isParent = stackIndex == -1 || stackIndex == 0;
    final navStack = AutoRouter.of(context).stackData;
    final isTrashEnabled =
        ref.watch(serverInfoProvider.select((v) => v.serverFeatures.trash));
    final isFromTrash = isTrashEnabled &&
        navStack.length > 2 &&
        navStack.elementAt(navStack.length - 2).name == TrashRoute.name;
    // !!!! itemsList and actionlist should always be in sync
    final itemsList = [
      BottomNavigationBarItem(
        icon: Icon(
          Platform.isAndroid ? Icons.share_rounded : Icons.ios_share_rounded,
        ),
        label: 'control_bottom_app_bar_share'.tr(),
        tooltip: 'control_bottom_app_bar_share'.tr(),
      ),
      if (isOwner)
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
              ),
      if (isOwner && stack.isNotEmpty)
        BottomNavigationBarItem(
          icon: const Icon(Icons.burst_mode_outlined),
          label: 'control_bottom_app_bar_stack'.tr(),
          tooltip: 'control_bottom_app_bar_stack'.tr(),
        ),
      if (isOwner)
        BottomNavigationBarItem(
          icon: const Icon(Icons.delete_outline),
          label: 'control_bottom_app_bar_delete'.tr(),
          tooltip: 'control_bottom_app_bar_delete'.tr(),
        ),
      if (!isOwner)
        BottomNavigationBarItem(
          icon: const Icon(Icons.download_outlined),
          label: 'download'.tr(),
          tooltip: 'download'.tr(),
        ),
    ];

    void removeAssetFromStack() {
      if (stackIndex > 0 && showStack) {
        ref
            .read(assetStackStateProvider(asset).notifier)
            .removeChild(stackIndex - 1);
      }
    }

    void handleDelete() async {
      // Cannot delete readOnly / external assets. They are handled through library offline jobs
      if (asset.isReadOnly) {
        ImmichToast.show(
          durationInSecond: 1,
          context: context,
          msg: 'asset_action_delete_err_read_only'.tr(),
          gravity: ToastGravity.BOTTOM,
        );
        return;
      }
      Future<bool> onDelete(bool force) async {
        final isDeleted = await ref.read(assetProvider.notifier).deleteAssets(
          {asset},
          force: force,
        );
        if (isDeleted && isParent) {
          if (totalAssets == 1) {
            // Handle only one asset
            context.popRoute();
          } else {
            // Go to next page otherwise
            controller.nextPage(
              duration: const Duration(milliseconds: 100),
              curve: Curves.fastLinearToSlowEaseIn,
            );
          }
        }
        return isDeleted;
      }

      // Asset is trashed
      if (isTrashEnabled && !isFromTrash) {
        final isDeleted = await onDelete(false);
        if (isDeleted) {
          // Can only trash assets stored in server. Local assets are always permanently removed for now
          if (context.mounted && asset.isRemote && isParent) {
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
                  if (!isParent)
                    ListTile(
                      leading: const Icon(
                        Icons.bookmark_border_outlined,
                        size: 24,
                      ),
                      onTap: () async {
                        await ref
                            .read(assetStackServiceProvider)
                            .updateStackParent(
                              asset,
                              stackElements.elementAt(stackIndex),
                            );
                        ctx.pop();
                        context.popRoute();
                      },
                      title: const Text(
                        "viewer_stack_use_as_main_asset",
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ).tr(),
                    ),
                  ListTile(
                    leading: const Icon(
                      Icons.copy_all_outlined,
                      size: 24,
                    ),
                    onTap: () async {
                      if (isParent) {
                        await ref
                            .read(assetStackServiceProvider)
                            .updateStackParent(
                              asset,
                              stackElements
                                  .elementAt(1), // Next asset as parent
                            );
                        // Remove itself from stack
                        await ref.read(assetStackServiceProvider).updateStack(
                          stackElements.elementAt(1),
                          childrenToRemove: [asset],
                        );
                        ctx.pop();
                        context.popRoute();
                      } else {
                        await ref.read(assetStackServiceProvider).updateStack(
                          asset,
                          childrenToRemove: [
                            stackElements.elementAt(stackIndex),
                          ],
                        );
                        removeAssetFromStack();
                        ctx.pop();
                      }
                    },
                    title: const Text(
                      "viewer_remove_from_stack",
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ).tr(),
                  ),
                  ListTile(
                    leading: const Icon(
                      Icons.filter_none_outlined,
                      size: 18,
                    ),
                    onTap: () async {
                      await ref.read(assetStackServiceProvider).updateStack(
                            asset,
                            childrenToRemove: stack,
                          );
                      ctx.pop();
                      context.popRoute();
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
      ref.read(imageViewerStateProvider.notifier).shareAsset(asset, context);
    }

    handleArchive() {
      ref.read(assetProvider.notifier).toggleArchive([asset]);
      if (isParent) {
        context.popRoute();
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

      ref.read(imageViewerStateProvider.notifier).downloadAsset(
            asset,
            context,
          );
    }

    List<Function(int)> actionslist = [
      (_) => shareAsset(),
      if (isOwner) (_) => handleArchive(),
      if (isOwner && stack.isNotEmpty) (_) => showStackActionItems(),
      if (isOwner) (_) => handleDelete(),
      if (!isOwner) (_) => handleDownload(),
    ];

    return IgnorePointer(
      ignoring: !ref.watch(showControlsProvider),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 100),
        opacity: ref.watch(showControlsProvider) ? 1.0 : 0.0,
        child: Column(
          children: [
            Visibility(
              visible: showVideoPlayerControls,
              child: const VideoControls(),
            ),
            BottomNavigationBar(
              backgroundColor: Colors.black.withOpacity(0.4),
              unselectedIconTheme: const IconThemeData(color: Colors.white),
              selectedIconTheme: const IconThemeData(color: Colors.white),
              unselectedLabelStyle: const TextStyle(color: Colors.black),
              selectedLabelStyle: const TextStyle(color: Colors.black),
              showSelectedLabels: false,
              showUnselectedLabels: false,
              items: itemsList,
              onTap: (index) {
                if (index < actionslist.length) {
                  actionslist[index].call(index);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

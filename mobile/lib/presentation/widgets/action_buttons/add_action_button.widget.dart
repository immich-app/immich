import 'dart:async';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/unarchive_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/providers/user.provider.dart';

import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/archive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';

class AddActionButton extends ConsumerWidget {
  const AddActionButton({super.key});

  void _openAlbumSelector(BuildContext context, WidgetRef ref) {
    final currentAsset = ref.read(currentAssetNotifier);
    if (currentAsset == null) {
      ImmichToast.show(context: context, msg: "Cannot load asset information.", toastType: ToastType.error);
      return;
    }

    final List<Widget> slivers = [
      AlbumSelector(onAlbumSelected: (album) => _addCurrentAssetToAlbum(context, ref, album)),
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return BaseBottomSheet(
          actions: const [],
          slivers: slivers,
          initialChildSize: 0.6,
          minChildSize: 0.3,
          maxChildSize: 0.95,
          expand: false,
          backgroundColor: context.isDarkTheme ? Colors.black : Colors.white,
        );
      },
    );
  }

  Future<void> _addCurrentAssetToAlbum(BuildContext context, WidgetRef ref, RemoteAlbum album) async {
    final latest = ref.read(currentAssetNotifier);

    if (latest == null) {
      ImmichToast.show(context: context, msg: "Cannot load asset information.", toastType: ToastType.error);
      return;
    }

    final addedCount = await ref.read(remoteAlbumProvider.notifier).addAssets(album.id, [latest.remoteId!]);

    if (!context.mounted) {
      return;
    }

    if (addedCount == 0) {
      ImmichToast.show(
        context: context,
        msg: 'add_to_album_bottom_sheet_already_exists'.tr(namedArgs: {'album': album.name}),
      );
    } else {
      ImmichToast.show(
        context: context,
        msg: 'add_to_album_bottom_sheet_added'.tr(namedArgs: {'album': album.name}),
      );
    }

    if (!context.mounted) {
      return;
    }
    await Navigator.of(context).maybePop();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }
    final user = ref.watch(currentUserProvider);
    final isOwner = asset is RemoteAsset && asset.ownerId == user?.id;
    final isInLockedView = ref.watch(inLockedViewProvider);
    final isArchived = asset is RemoteAsset && asset.visibility == AssetVisibility.archive;
    final hasRemote = asset is RemoteAsset;
    final showArchive = isOwner && !isInLockedView && hasRemote && !isArchived;
    final showUnarchive = isOwner && !isInLockedView && hasRemote && isArchived;

    final theme = context.themeData;
    final menuChildren = <Widget>[];

    void addSection(String label, List<Widget> items) {
      if (items.isEmpty) {
        return;
      }

      if (menuChildren.isNotEmpty) {
        menuChildren.add(const Divider(height: 0));
      }

      menuChildren.add(_buildSectionLabel(context, theme, label));

      for (final item in items) {
        // menuChildren.add(const Divider(height: 0));
        menuChildren.add(item);
      }
    }

    addSection("add_to_bottom_bar".tr(), [
      BaseActionButton(
        label: "album".tr(),
        iconData: Icons.photo_album_outlined,
        iconColor: context.primaryColor,
        onPressed: () => _openAlbumSelector(context, ref),
      ),
    ]);

    final moveItems = <Widget>[];
    if (isOwner) {
      if (showArchive) {
        moveItems.add(
          BaseActionButton(
            label: "archive".tr(),
            iconData: Icons.archive_outlined,
            iconColor: context.primaryColor,
            onPressed: () => performArchiveAction(context, ref, source: ActionSource.viewer),
          ),
        );
      }

      if (showUnarchive) {
        moveItems.add(
          BaseActionButton(
            label: "unarchive".tr(),
            iconData: Icons.unarchive_outlined,
            iconColor: context.primaryColor,
            onPressed: () => performUnArchiveAction(context, ref, source: ActionSource.viewer),
          ),
        );
      }

      moveItems.add(
        BaseActionButton(
          label: "locked_folder".tr(),
          iconData: Icons.lock_outline,
          iconColor: context.primaryColor,
          onPressed: () => performMoveToLockFolderAction(context, ref, source: ActionSource.viewer),
        ),
      );
    }

    addSection("move_to".tr(), moveItems);

    return MenuAnchor(
      style: MenuStyle(
        backgroundColor: WidgetStatePropertyAll(theme.scaffoldBackgroundColor),
        elevation: const WidgetStatePropertyAll(4),
        shape: WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
        padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(vertical: 2)),
      ),
      menuChildren: menuChildren,
      builder: (anchorContext, controller, child) {
        return BaseActionButton(
          iconData: Icons.add,
          label: "add_to_bottom_bar".tr(),
          detectMenuAnchor: false,
          onPressed: () {
            if (controller.isOpen) {
              controller.close();
            } else {
              controller.open();
            }
          },
        );
      },
    );
  }

  Widget _buildSectionLabel(BuildContext context, ThemeData theme, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: Text(
        text,
        style: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.9)),
      ),
    );
  }
}

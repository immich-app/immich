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

enum AddToMenuItem { album, archive, unarchive, lockedFolder }

class AddActionButton extends ConsumerStatefulWidget {
  const AddActionButton({super.key, this.originalTheme});

  final ThemeData? originalTheme;

  @override
  ConsumerState<AddActionButton> createState() => _AddActionButtonState();
}

class _AddActionButtonState extends ConsumerState<AddActionButton> {
  void _handleMenuSelection(AddToMenuItem selected) {
    switch (selected) {
      case AddToMenuItem.album:
        _openAlbumSelector();
        break;
      case AddToMenuItem.archive:
        performArchiveAction(context, ref, source: ActionSource.viewer);
        break;
      case AddToMenuItem.unarchive:
        performUnArchiveAction(context, ref, source: ActionSource.viewer);
        break;
      case AddToMenuItem.lockedFolder:
        performMoveToLockFolderAction(context, ref, source: ActionSource.viewer);
        break;
    }
  }

  List<Widget> _buildMenuChildren() {
    final asset = ref.read(currentAssetNotifier);
    if (asset == null) return [];

    final user = ref.read(currentUserProvider);
    final isOwner = asset is RemoteAsset && asset.ownerId == user?.id;
    final isInLockedView = ref.watch(inLockedViewProvider);
    final isArchived = asset is RemoteAsset && asset.visibility == AssetVisibility.archive;
    final hasRemote = asset is RemoteAsset;
    final showArchive = isOwner && !isInLockedView && hasRemote && !isArchived;
    final showUnarchive = isOwner && !isInLockedView && hasRemote && isArchived;

    return [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Text("add_to_bottom_bar".tr(), style: context.textTheme.labelMedium),
      ),
      BaseActionButton(
        iconData: Icons.photo_album_outlined,
        label: "album".tr(),
        menuItem: true,
        onPressed: () => _handleMenuSelection(AddToMenuItem.album),
      ),

      if (isOwner) ...[
        const Divider(),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text("move_to".tr(), style: context.textTheme.labelMedium),
        ),
        if (showArchive)
          BaseActionButton(
            iconData: Icons.archive_outlined,
            label: "archive".tr(),
            menuItem: true,
            onPressed: () => _handleMenuSelection(AddToMenuItem.archive),
          ),
        if (showUnarchive)
          BaseActionButton(
            iconData: Icons.unarchive_outlined,
            label: "unarchive".tr(),
            menuItem: true,
            onPressed: () => _handleMenuSelection(AddToMenuItem.unarchive),
          ),
        BaseActionButton(
          iconData: Icons.lock_outline,
          label: "locked_folder".tr(),
          menuItem: true,
          onPressed: () => _handleMenuSelection(AddToMenuItem.lockedFolder),
        ),
      ],
    ];
  }

  void _openAlbumSelector() {
    final currentAsset = ref.read(currentAssetNotifier);
    if (currentAsset == null) {
      ImmichToast.show(context: context, msg: "Cannot load asset information.", toastType: ToastType.error);
      return;
    }

    final List<Widget> slivers = [
      const CreateAlbumButton(),
      AlbumSelector(onAlbumSelected: (album) => _addCurrentAssetToAlbum(album)),
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

  Future<void> _addCurrentAssetToAlbum(RemoteAlbum album) async {
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

      // Invalidate using the asset's remote ID to refresh the "Appears in" list
      ref.invalidate(albumsContainingAssetProvider(latest.remoteId!));
    }

    if (!context.mounted) {
      return;
    }
    await Navigator.of(context).maybePop();
  }

  @override
  Widget build(BuildContext context) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }

    final themeData = widget.originalTheme ?? context.themeData;

    return MenuAnchor(
      consumeOutsideTap: true,
      style: MenuStyle(
        backgroundColor: WidgetStatePropertyAll(themeData.scaffoldBackgroundColor),
        surfaceTintColor: const WidgetStatePropertyAll(Colors.grey),
        elevation: const WidgetStatePropertyAll(4),
        shape: const WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
        ),
        padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(vertical: 6)),
      ),
      menuChildren: widget.originalTheme != null
          ? [
              Theme(
                data: widget.originalTheme!,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: _buildMenuChildren()),
              ),
            ]
          : _buildMenuChildren(),
      builder: (context, controller, child) {
        return BaseActionButton(
          iconData: Icons.add,
          label: "add_to_bottom_bar".tr(),
          onPressed: () => controller.isOpen ? controller.close() : controller.open(),
        );
      },
    );
  }
}

// dart
// File: 'lib/presentation/widgets/action_buttons/add_action_button.widget.dart'
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/unarchive_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/providers/user.provider.dart';

import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/archive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';

import '../../../providers/routes.provider.dart';

enum _AddMenu { album, archive, unarchive, lockedFolder }

class AddActionButton extends ConsumerWidget {
  const AddActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {

    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }
    return Builder(
      builder: (buttonContext) {
        return BaseActionButton(
          iconData: Icons.add,
          label: "add_to_bottom_bar".tr(),
          onPressed: () => _showAddOptions(buttonContext, ref),
        );
      },
    );
  }

  Future<void> _showAddOptions(BuildContext context, WidgetRef ref) async {
    final asset = ref.read(currentAssetNotifier);
    if (asset == null) return;

    final user = ref.read(currentUserProvider);
    final isOwner = asset is RemoteAsset && asset.ownerId == user?.id;
    final isInLockedView = ref.watch(inLockedViewProvider);
    final isArchived = asset is RemoteAsset && asset.visibility == AssetVisibility.archive;
    final hasRemote = asset is RemoteAsset;
    final showArchive = isOwner && !isInLockedView && hasRemote && !isArchived;
    final showUnarchive = isOwner && !isInLockedView && hasRemote && isArchived;

    final List<PopupMenuEntry<_AddMenu>> items = [
      PopupMenuItem(
        value: _AddMenu.album,
        child: ListTile(
          leading: const Icon(Icons.photo_album_outlined),
          title: Text("album".tr()),
        ),
      ),
      if (isOwner) ...[
        if (showArchive)
          PopupMenuItem(
            value: _AddMenu.archive,
            child: ListTile(
              leading: const Icon(Icons.archive_outlined),
              title: Text("archive".tr()),
            ),
          ),
        if (showUnarchive)
          PopupMenuItem(
            value: _AddMenu.unarchive,
            child: ListTile(
              leading: const Icon(Icons.unarchive_outlined),
              title: Text("unarchive".tr()),
            ),
          ),
        PopupMenuItem(
          value: _AddMenu.lockedFolder,
          child: ListTile(
            leading: const Icon(Icons.lock_outline),
            title: Text("locked_folder".tr()),
          ),
        ),
      ],
    ];

    final _AddMenu? selected = await showMenu<_AddMenu>(
      context: context,
      color: context.themeData.scaffoldBackgroundColor,
      position: _menuPosition(context),
      items: items,
    );

    if (selected == null) return;

    switch (selected) {
      case _AddMenu.album:
        _openAlbumSelector(context, ref);
        break;
      case _AddMenu.archive:
        await performArchiveAction(context, ref, source: ActionSource.viewer);
        break;
      case _AddMenu.unarchive:
        await performUnArchiveAction(context, ref, source: ActionSource.viewer);
        break;

      case _AddMenu.lockedFolder:
        await performMoveToLockFolderAction(context, ref, source: ActionSource.viewer);
        break;
    }
  }

  RelativeRect _menuPosition(BuildContext context) {
    final renderObject = context.findRenderObject();
    if (renderObject is! RenderBox) {
      return RelativeRect.fill;
    }

    final size = renderObject.size;
    final position = renderObject.localToGlobal(Offset.zero);

    return RelativeRect.fromLTRB(position.dx, position.dy - size.height - 110, position.dx + size.width, position.dy);
  }

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

    if (!context.mounted) return;

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

    if (!context.mounted) return;
    await Navigator.of(context).maybePop();
  }
}

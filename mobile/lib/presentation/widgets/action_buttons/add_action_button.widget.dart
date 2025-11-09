// dart
// File: 'lib/presentation/widgets/action_buttons/add_action_button.widget.dart'
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/providers/user.provider.dart';

import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

import '../../../constants/enums.dart';
import 'archive_action_button.widget.dart';
import 'move_to_lock_folder_action_button.widget.dart';

enum _AddMenu { album, archive, lockedFolder }

class AddActionButton extends ConsumerWidget {
  const AddActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Builder(
      builder: (buttonContext) {
        return BaseActionButton(
          iconData: Icons.add,
          label: "add_to".tr(),
          onPressed: () => _showAddOptions(buttonContext, ref),
        );
      },
    );
  }

  void _showAddOptions(BuildContext context, WidgetRef ref) {
    final asset = ref.read(currentAssetNotifier);
    if (asset == null) return;

    final user = ref.read(currentUserProvider);
    final isOwner = asset is RemoteAsset && asset.ownerId == user?.id;

    final List<PopupMenuEntry<_AddMenu>> items = [
      PopupMenuItem(
        value: _AddMenu.album,
        child: ListTile(leading: const Icon(Icons.photo_album_outlined), title: Text("album".tr())),
      ),
      if (asset.hasRemote && isOwner) ...[
        PopupMenuItem(
          value: _AddMenu.archive,
          child: ListTile(leading: const Icon(Icons.archive_outlined), title: Text("archive".tr())),
        ),
        PopupMenuItem(
          value: _AddMenu.lockedFolder,
          child: ListTile(leading: const Icon(Icons.lock_outline), title: Text("locked_folder".tr())),
        ),
      ],
    ];

    showMenu<_AddMenu>(
      context: context,
      color: context.themeData.scaffoldBackgroundColor,
      position: _menuPosition(context),
      items: items,
    ).then((selected) {
      if (selected == null) return;

      // Safety re-check in case state changed while menu was open
      final latest = ref.read(currentAssetNotifier);
      final currentUser = ref.read(currentUserProvider);
      final allowedOwner = latest is RemoteAsset && latest.ownerId == currentUser?.id;
      final hasRemote = latest?.hasRemote == true;

      switch (selected) {
        case _AddMenu.album:
          _openAlbumSelector(context, ref);
          break;
        case _AddMenu.archive:
          if (hasRemote && allowedOwner) {
            performArchiveAction(context, ref, source: ActionSource.viewer);
          } else {
            ImmichToast.show(
              context: context,
              msg: "Only the owner can archive this asset.",
              toastType: ToastType.info,
            );
          }
          break;
        case _AddMenu.lockedFolder:
          if (hasRemote && allowedOwner) {
            performMoveToLockFolderAction(context, ref, source: ActionSource.viewer);
          } else {
            ImmichToast.show(
              context: context,
              msg: "Only the owner can move this asset to a locked folder.",
              toastType: ToastType.info,
            );
          }
          break;
      }
    });
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

    final List<Widget> slivers = currentAsset.hasRemote
        ? [AlbumSelector(onAlbumSelected: (album) => _addCurrentAssetToAlbum(context, ref, album))]
        : [
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Center(child: Text('This asset is not backed up to the server.', textAlign: TextAlign.center)),
              ),
            ),
          ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.3,
          maxChildSize: 0.95,
          expand: false,
          builder: (_, scrollController) {
            return Material(
              color: context.themeData.scaffoldBackgroundColor,
              child: CustomScrollView(controller: scrollController, slivers: slivers),
            );
          },
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

    if (!latest.hasRemote) {
      ImmichToast.show(context: context, msg: "This asset is not backed up to the server.", toastType: ToastType.error);
      return;
    }

    final id = _remoteIdOf(latest);
    if (id == null) {
      ImmichToast.show(context: context, msg: "Cannot determine remote asset id.", toastType: ToastType.error);
      return;
    }

    final addedCount = await ref.read(remoteAlbumProvider.notifier).addAssets(album.id, [id]);

    if (!context.mounted) return;

    if (addedCount == 0) {
      ImmichToast.show(context: context, msg: 'This photo is already in "${album.name}".');
    } else {
      ImmichToast.show(context: context, msg: 'Added to "${album.name}".');
    }

    if (!context.mounted) return;
    await Navigator.of(context).maybePop();
  }

  String? _remoteIdOf(Object asset) {
    if (asset is RemoteAsset) return asset.id;

    try {
      final dyn = asset as dynamic;
      final rid = dyn.remoteId ?? dyn.id;
      return rid is String ? rid : null;
    } catch (_) {
      return null;
    }
  }
}

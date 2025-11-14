import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/remote_asset.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/asset_album_membership_sheet.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class AddToAlbumActionButton extends ConsumerWidget {
  const AddToAlbumActionButton({
    super.key,
    required this.asset,
    required this.source,
    required this.canManageAlbums,
    required this.canToggleLockedFolder,
  });

  final BaseAsset asset;
  final ActionSource source;
  final bool canManageAlbums;
  final bool canToggleLockedFolder;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool shouldShow = canManageAlbums || canToggleLockedFolder;
    if (!shouldShow) {
      return const SizedBox.shrink();
    }
    return BaseActionButton(
      iconData: Icons.add,
      label: 'add_to'.t(context: context),
      onPressed: () => _showAddToSheet(parentContext: context, ref: ref),
      maxWidth: 110,
    );
  }

  Future<void> _showAddToSheet({required BuildContext parentContext, required WidgetRef ref}) async {
    final remoteAsset = asset is RemoteAsset ? asset as RemoteAsset : null;
    final isLocked = remoteAsset?.visibility == AssetVisibility.locked;

    await showModalBottomSheet(
      context: parentContext,
      builder: (sheetContext) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (canManageAlbums)
                ListTile(
                  leading: const Icon(Icons.photo_library_outlined),
                  title: Text('add_to_album'.t(context: parentContext)),
                  subtitle: Text('asset_album_membership_title'.t(context: parentContext)),
                  onTap: () async {
                    Navigator.of(sheetContext).pop();
                    await manageAssetAlbumMembership(
                      context: parentContext,
                      ref: ref,
                      asset: asset,
                      source: source,
                    );
                  },
                ),
                if (canToggleLockedFolder && remoteAsset != null)
                  ListTile(
                    leading: Icon(isLocked ? Icons.lock_open_outlined : Icons.lock_outline),
                    title: Text(
                      (isLocked ? 'remove_from_locked_folder' : 'move_to_locked_folder')
                          .t(context: parentContext),
                    ),
                    onTap: () async {
                      Navigator.of(sheetContext).pop();
                      await _toggleLockedFolder(parentContext, ref, isLocked);
                    },
                  ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _toggleLockedFolder(BuildContext context, WidgetRef ref, bool isLocked) async {
    final notifier = ref.read(actionProvider.notifier);
    final result =
        isLocked ? await notifier.removeFromLockFolder(source) : await notifier.moveToLockFolder(source);

    if (source == ActionSource.viewer) {
      EventStream.shared.emit(const ViewerReloadAssetEvent());
    }

    if (!context.mounted) {
      return;
    }

    final messageKey =
        isLocked ? 'remove_from_lock_folder_action_prompt' : 'move_to_lock_folder_action_prompt';
    final successMessage = messageKey.t(
      context: context,
      args: {'count': result.count.toString()},
    );

    ImmichToast.show(
      context: context,
      msg: result.success ? successMessage : 'scaffold_body_error_occurred'.t(context: context),
      gravity: ToastGravity.BOTTOM,
      toastType: result.success ? ToastType.success : ToastType.error,
    );
  }
}

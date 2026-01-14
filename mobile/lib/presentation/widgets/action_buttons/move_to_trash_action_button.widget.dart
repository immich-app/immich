import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

import 'base_action_button.widget.dart';

void showTrashResultToast(BuildContext context, ActionResult result) {
  if (!context.mounted) return;
  final message = result.success
      ? 'assets_allowed_to_moved_to_trash_count'.t(args: {'count': '${result.count}'})
      : 'scaffold_body_error_occurred'.t();
  ImmichToast.show(
    context: context,
    msg: message,
    gravity: ToastGravity.BOTTOM,
    toastType: result.success ? ToastType.success : ToastType.error,
  );
}

/// This move to trash action has the following behavior:
/// - Allows moving to the local trash those assets that are in the remote trash.
///
/// This action is used when the asset is selected in multi-selection mode in the review out-of-sync changes
class MoveToTrashActionButton extends ConsumerWidget {
  final ActionSource source;
  final void Function(ActionResult result) onResult;

  const MoveToTrashActionButton({super.key, required this.source, required this.onResult});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }
    final selectedCount = source == ActionSource.viewer ? 1 : ref.read(multiSelectProvider).selectedAssets.length;
    final assetViewerNotifier = ref.read(assetViewerProvider.notifier);
    assetViewerNotifier.setControls(false);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('asset_out_of_sync_trash_confirmation_title'.tr()),
          content: Text('asset_out_of_sync_trash_confirmation_text'.t(args: {'count': '$selectedCount'})),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text('cancel'.t(context: context)),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: TextButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
              child: Text('control_bottom_app_bar_trash_from_immich'.tr()),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      assetViewerNotifier.setControls(true);
      return;
    }
    //todo STEP 2
    final multiSelectNotifier = ref.read(multiSelectProvider.notifier);
    multiSelectNotifier.reset();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const iconData = Icons.delete_forever_outlined;
    return (source == ActionSource.viewer)
        ? BaseActionButton(
            maxWidth: 100.0,
            iconData: iconData,
            label: 'delete'.tr(),
            onPressed: () => _onTap(context, ref),
          )
        : TextButton.icon(
            icon: Icon(iconData, color: Colors.red[400]),
            label: Text(
              'control_bottom_app_bar_trash_from_immich'.tr(),
              style: TextStyle(fontSize: 14, color: Colors.red[400], fontWeight: FontWeight.bold),
            ),
            onPressed: () => _onTap(context, ref),
          );
  }
}

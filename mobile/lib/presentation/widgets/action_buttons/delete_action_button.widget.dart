import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

/// This delete action has the following behavior:
/// - Set the deletedAt information, put the asset in the trash in the server
/// which will be permanently deleted after the number of days configure by the admin
/// - Prompt to delete the asset locally
class DeleteActionButton extends ConsumerWidget {
  final ActionSource source;
  final bool showConfirmation;
  final bool iconOnly;
  final bool menuItem;
  const DeleteActionButton({
    super.key,
    required this.source,
    this.showConfirmation = false,
    this.iconOnly = false,
    this.menuItem = false,
  });

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    if (showConfirmation) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('delete'.t(context: context)),
          content: Text('delete_action_confirmation_message'.t(context: context)),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text('cancel'.t(context: context)),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(
                'confirm'.t(context: context),
                style: TextStyle(color: context.colorScheme.error),
              ),
            ),
          ],
        ),
      );
      if (confirm != true) return;
    }

    final result = await ref.read(actionProvider.notifier).trashRemoteAndDeleteLocal(source);
    ref.read(multiSelectProvider.notifier).reset();

    if (source == ActionSource.viewer) {
      EventStream.shared.emit(const ViewerReloadAssetEvent());
    }

    final successMessage = 'delete_action_prompt'.t(context: context, args: {'count': result.count.toString()});

    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: result.success ? successMessage : 'scaffold_body_error_occurred'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: result.success ? ToastType.success : ToastType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      maxWidth: 110.0,
      iconData: Icons.delete_sweep_outlined,
      label: "delete".t(context: context),
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => _onTap(context, ref),
    );
  }
}

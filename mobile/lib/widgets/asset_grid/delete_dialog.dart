import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';

class DeleteDialog extends ConfirmDialog {
  const DeleteDialog({super.key, String? alert, required Function onDelete})
    : super(
        title: "delete_dialog_title",
        content: alert ?? "delete_dialog_alert",
        cancel: "cancel",
        ok: "delete",
        onOk: onDelete,
      );
}

class DeleteLocalOnlyDialog extends StatelessWidget {
  final void Function(bool onlyMerged) onDeleteLocal;

  const DeleteLocalOnlyDialog({super.key, required this.onDeleteLocal});

  @override
  Widget build(BuildContext context) {
    void onDeleteBackedUpOnly() {
      context.pop(true);
      onDeleteLocal(true);
    }

    void onForceDelete() {
      context.pop(false);
      onDeleteLocal(false);
    }

    return AlertDialog(
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
      title: const Text("delete_dialog_title").tr(),
      content: const Text("delete_dialog_alert_local_non_backed_up").tr(),
      actions: [
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: () => context.pop(),
            style: FilledButton.styleFrom(
              backgroundColor: context.colorScheme.surfaceDim,
              foregroundColor: context.primaryColor,
            ),
            child: const Text("cancel", style: TextStyle(fontWeight: FontWeight.bold)).tr(),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          height: 48,

          child: FilledButton(
            onPressed: onDeleteBackedUpOnly,
            style: FilledButton.styleFrom(
              backgroundColor: context.colorScheme.errorContainer,
              foregroundColor: context.colorScheme.onErrorContainer,
            ),
            child: const Text(
              "delete_local_dialog_ok_backed_up_only",
              style: TextStyle(fontWeight: FontWeight.bold),
            ).tr(),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: onForceDelete,
            style: FilledButton.styleFrom(backgroundColor: Colors.red[400], foregroundColor: Colors.white),
            child: const Text("delete_local_dialog_ok_force", style: TextStyle(fontWeight: FontWeight.bold)).tr(),
          ),
        ),
      ],
    );
  }
}

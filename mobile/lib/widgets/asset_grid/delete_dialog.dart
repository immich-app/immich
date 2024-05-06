// ignore_for_file: prefer-single-widget-per-file

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';

class DeleteDialog extends ConfirmDialog {
  const DeleteDialog({super.key, String? alert, required Function onDelete})
      : super(
          title: "delete_dialog_title",
          content: alert ?? "delete_dialog_alert",
          cancel: "delete_dialog_cancel",
          ok: "delete_dialog_ok",
          onOk: onDelete,
        );
}

class DeleteLocalOnlyDialog extends StatelessWidget {
  final void Function(bool onlyMerged) onDeleteLocal;

  const DeleteLocalOnlyDialog({
    super.key,
    required this.onDeleteLocal,
  });

  @override
  Widget build(BuildContext context) {
    void onDeleteBackedUpOnly() {
      context.pop();
      onDeleteLocal(true);
    }

    void onForceDelete() {
      context.pop();
      onDeleteLocal(false);
    }

    return AlertDialog(
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
      ),
      title: const Text("delete_dialog_title").tr(),
      content: const Text("delete_dialog_alert_local_non_backed_up").tr(),
      actions: [
        TextButton(
          onPressed: () => context.pop(),
          child: Text(
            "delete_dialog_cancel",
            style: TextStyle(
              color: context.primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
        TextButton(
          onPressed: onDeleteBackedUpOnly,
          child: Text(
            "delete_local_dialog_ok_backed_up_only",
            style: TextStyle(
              color: context.colorScheme.tertiary,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
        TextButton(
          onPressed: onForceDelete,
          child: Text(
            "delete_local_dialog_ok_force",
            style: TextStyle(
              color: Colors.red[400],
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
      ],
    );
  }
}

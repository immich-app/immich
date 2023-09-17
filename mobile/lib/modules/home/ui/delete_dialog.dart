import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/ui/confirm_dialog.dart';

class DeleteDialog extends ConfirmDialog {
  final Function onDelete;

  const DeleteDialog({Key? key, required this.onDelete})
      : super(
          key: key,
          title: "delete_dialog_title",
          content: "delete_dialog_alert",
          cancel: "delete_dialog_cancel",
          ok: "delete_dialog_ok",
          onOk: onDelete,
        );
}

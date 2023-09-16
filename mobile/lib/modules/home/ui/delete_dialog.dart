import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/ui/confirm_dialog.dart';

class DeleteDialog extends ConfirmDialog {
  final Function onDelete;
  final bool isTrashEnabled;

  const DeleteDialog({
    Key? key,
    required this.onDelete,
    this.isTrashEnabled = false,
  }) : super(
          key: key,
          title: !isTrashEnabled ? "delete_dialog_title" : "Trash Asset",
          content: !isTrashEnabled
              ? "delete_dialog_alert"
              : "These items will be moved to trash",
          cancel: !isTrashEnabled ? "delete_dialog_cancel" : "Trash",
          ok: "delete_dialog_ok",
          onOk: onDelete,
        );
}

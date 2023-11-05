import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/ui/confirm_dialog.dart';

class DeleteDialog extends ConfirmDialog {
  final Function onDelete;

  const DeleteDialog({
    Key? key,
    required this.onDelete,
    String? content,
    String? ok,
    Color? contentColor,
  }) : super(
          key: key,
          title: "delete_dialog_title",
          content: content ?? "delete_dialog_alert",
          cancel: "delete_dialog_cancel",
          ok: ok ?? "delete_dialog_ok",
          onOk: onDelete,
          contentColor: contentColor,
        );
}

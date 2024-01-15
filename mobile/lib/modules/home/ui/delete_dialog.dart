import 'package:immich_mobile/shared/ui/confirm_dialog.dart';

class DeleteDialog extends ConfirmDialog {
  final Function onDelete;

  const DeleteDialog({super.key, required this.onDelete})
      : super(
          title: "delete_dialog_title",
          content: "delete_dialog_alert",
          cancel: "delete_dialog_cancel",
          ok: "delete_dialog_ok",
          onOk: onDelete,
        );
}

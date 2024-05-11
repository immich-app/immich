import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class ConfirmDialog extends StatelessWidget {
  final Function onOk;
  final String title;
  final String content;
  final String cancel;
  final String ok;

  const ConfirmDialog({
    super.key,
    required this.onOk,
    required this.title,
    required this.content,
    this.cancel = "delete_dialog_cancel",
    this.ok = "backup_controller_page_background_battery_info_ok",
  });

  @override
  Widget build(BuildContext context) {
    void onOkPressed() {
      onOk();
      context.pop(true);
    }

    return AlertDialog(
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
      ),
      title: Text(title).tr(),
      content: Text(content).tr(),
      actions: [
        TextButton(
          onPressed: () => context.pop(false),
          child: Text(
            cancel,
            style: TextStyle(
              color: context.primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
        TextButton(
          onPressed: onOkPressed,
          child: Text(
            ok,
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

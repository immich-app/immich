import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class ConfirmDialog extends ConsumerWidget {
  final Function onOk;
  final String title;
  final String content;
  final String cancel;
  final String ok;

  const ConfirmDialog({
    Key? key,
    required this.onOk,
    required this.title,
    required this.content,
    this.cancel = "delete_dialog_cancel",
    this.ok = "backup_controller_page_background_battery_info_ok",
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      title: Text(title).tr(),
      content: Text(content).tr(),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(
            cancel,
            style: TextStyle(
              color: Theme.of(context).primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
        TextButton(
          onPressed: () {
            onOk();
            Navigator.of(context).pop();
          },
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

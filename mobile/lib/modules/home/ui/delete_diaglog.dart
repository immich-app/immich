import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class DeleteDialog extends ConsumerWidget {
  final Function onDelete;

  const DeleteDialog({Key? key, required this.onDelete}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {

    return AlertDialog(
      backgroundColor: Colors.grey[200],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      title: const Text("delete_dialog_title").tr(),
      content: const Text("delete_dialog_alert").tr(),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: const Text(
            "delete_dialog_cancel",
            style: TextStyle(color: Colors.blueGrey),
          ).tr(),
        ),
        TextButton(
          onPressed: () {
            onDelete();
            Navigator.of(context).pop();
          },
          child: Text(
            "delete_dialog_ok",
            style: TextStyle(color: Colors.red[400]),
          ).tr(),
        ),
      ],
    );
  }
}

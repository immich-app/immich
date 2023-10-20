import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
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

class DeleteLocalDialog extends HookConsumerWidget {
  final Function(bool onlyMerged) onDelete;

  const DeleteLocalDialog({
    Key? key,
    required this.onDelete,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeData = Theme.of(context);
    final onlyMerged = useState(true);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      title: const Text("delete_dialog_title").tr(),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text("delete_dialog_alert_local").tr(),
          Padding(
            padding: const EdgeInsets.only(top: 20),
            child: SwitchListTile.adaptive(
              value: onlyMerged.value,
              onChanged: (value) {
                onlyMerged.value = value;
              },
              activeColor: themeData.primaryColor,
              dense: true,
              title: Text(
                "delete_dialog_alert_merged_only",
                style: themeData.textTheme.labelLarge
                    ?.copyWith(fontWeight: FontWeight.bold),
              ).tr(),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text(
            "delete_dialog_cancel",
            style: TextStyle(
              color: Theme.of(context).primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
        TextButton(
          onPressed: () {
            onDelete(onlyMerged.value);
            Navigator.of(context).pop(true);
          },
          child: Text(
            "delete_dialog_ok",
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

import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';

class ConfirmDialog extends StatelessWidget {
  final Function? onOk;
  final String title;
  final String content;
  final String? cancel;
  final String? ok;

  const ConfirmDialog({super.key, this.onOk, required this.title, required this.content, this.cancel, this.ok});

  @override
  Widget build(BuildContext context) {
    void onOkPressed() {
      onOk?.call();
      context.pop(true);
    }

    return AlertDialog(
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
      title: Text(title),
      content: Text(content),
      actions: [
        TextButton(
          onPressed: () => context.pop(false),
          child: Text(
            cancel ?? context.t.cancel,
            style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold),
          ),
        ),
        TextButton(
          onPressed: onOkPressed,
          child: Text(
            ok ?? context.t.backup_controller_page_background_battery_info_ok,
            style: TextStyle(color: context.colorScheme.error, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}

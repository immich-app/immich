import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';

class DeleteLocalOnlyDialog extends StatelessWidget {
  final void Function(bool onlyMerged) onDeleteLocal;

  const DeleteLocalOnlyDialog({super.key, required this.onDeleteLocal});

  @override
  Widget build(BuildContext context) {
    void onDeleteBackedUpOnly() {
      context.pop(true);
      onDeleteLocal(true);
    }

    void onForceDelete() {
      context.pop(false);
      onDeleteLocal(false);
    }

    return AlertDialog(
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
      title: Text(context.t.delete_dialog_title),
      content: Text(context.t.delete_dialog_alert_local_non_backed_up),
      actions: [
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: () => context.pop(),
            style: FilledButton.styleFrom(
              backgroundColor: context.colorScheme.surfaceDim,
              foregroundColor: context.primaryColor,
            ),
            child: Text(context.t.cancel, style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          height: 48,

          child: FilledButton(
            onPressed: onDeleteBackedUpOnly,
            style: FilledButton.styleFrom(
              backgroundColor: context.colorScheme.errorContainer,
              foregroundColor: context.colorScheme.onErrorContainer,
            ),
            child: Text(
              context.t.delete_local_dialog_ok_backed_up_only,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: onForceDelete,
            style: FilledButton.styleFrom(backgroundColor: Colors.red[400], foregroundColor: Colors.white),
            child: Text(context.t.delete_local_dialog_ok_force, style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }
}

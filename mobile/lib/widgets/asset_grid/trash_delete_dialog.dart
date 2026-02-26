import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_ui/immich_ui.dart';

class TrashDeleteDialog extends StatelessWidget {
  const TrashDeleteDialog({super.key, required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
      title: Text(context.t.permanently_delete),
      content: ImmichFormattedText(context.t.permanently_delete_assets_prompt(count: count)),
      actions: [
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: () => context.pop(false),
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
            onPressed: () => context.pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: context.colorScheme.errorContainer,
              foregroundColor: context.colorScheme.onErrorContainer,
            ),
            child: Text(context.t.delete, style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }
}

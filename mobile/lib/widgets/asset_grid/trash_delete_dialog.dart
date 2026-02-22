import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_ui/immich_ui.dart';

class TrashDeleteDialog extends StatelessWidget {
  const TrashDeleteDialog({super.key, required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
      title: const Text("permanently_delete").t(context: context),
      content: ImmichHtmlText(
        "permanently_delete_assets_prompt".t(context: context, args: {'count': count.toString()}),
      ),
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
            child: const Text("cancel", style: TextStyle(fontWeight: FontWeight.bold)).t(context: context),
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
            child: const Text("delete", style: TextStyle(fontWeight: FontWeight.bold)).t(context: context),
          ),
        ),
      ],
    );
  }
}

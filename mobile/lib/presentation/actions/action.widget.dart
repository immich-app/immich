import 'package:flutter/material.dart' hide Action;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_ui/immich_ui.dart';

abstract class ActionWidget extends ConsumerWidget {
  final ActionDisplay display;

  const ActionWidget({super.key, this.display = ActionDisplay.button});

  Action resolve(BuildContext context, WidgetRef ref);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final action = resolve(context, ref);
    if (!action.isVisible) {
      return const SizedBox.shrink();
    }

    return switch (display) {
      ActionDisplay.button =>
        ImmichTextButton(labelText: action.label, icon: action.icon, onPressed: action.onAction),
      ActionDisplay.iconButton => ImmichIconButton(icon: action.icon, onPressed: action.onAction),
      ActionDisplay.menuItem =>
        ImmichMenuItem(icon: action.icon, label: action.label, onPressed: action.onAction),
      ActionDisplay.columnButton =>
        ImmichColumnButton(icon: action.icon, label: action.label, onPressed: action.onAction),
    };
  }
}

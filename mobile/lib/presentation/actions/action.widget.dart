import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:immich_ui/immich_ui.dart';

class _ActionWidget extends ConsumerWidget {
  final BaseAction action;
  final Widget Function(Future<void> Function() onAction) builder;

  const _ActionWidget({required this.action, required this.builder});

  Future<void> _onAction(BuildContext context, WidgetRef ref) async {
    try {
      await action.onAction(context, ref);
    } catch (error, stackTrace) {
      handleError(context, error, stack: stackTrace, description: 'Action failed: ${action.runtimeType}');
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!action.isVisible(context, ref)) {
      return const SizedBox.shrink();
    }

    return builder(() => _onAction(context, ref));
  }
}

class ActionIconButtonWidget extends StatelessWidget {
  final BaseAction action;
  final ImmichVariant variant;

  const ActionIconButtonWidget({super.key, required this.action, this.variant = .ghost});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    builder: (onAction) => ImmichIconButton(icon: action.icon, onPressed: onAction, variant: variant),
  );
}

class ActionButtonWidget extends StatelessWidget {
  final BaseAction action;
  final ImmichVariant variant;

  const ActionButtonWidget({super.key, required this.action, this.variant = .ghost});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    builder: (onAction) =>
        ImmichTextButton(labelText: action.label(context), icon: action.icon, onPressed: onAction, variant: variant),
  );
}

class ActionColumnButtonWidget extends StatelessWidget {
  final BaseAction action;

  const ActionColumnButtonWidget({super.key, required this.action});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    builder: (onAction) => ImmichColumnButton(icon: action.icon, label: action.label(context), onPressed: onAction),
  );
}

class ActionMenuItemWidget extends StatelessWidget {
  final BaseAction action;

  const ActionMenuItemWidget({super.key, required this.action});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    builder: (onAction) => ImmichMenuItem(icon: action.icon, label: action.label(context), onPressed: onAction),
  );
}

import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:immich_ui/immich_ui.dart';

class _ActionWidgetScope {
  final String label;
  final VoidCallback onAction;

  const _ActionWidgetScope({required this.label, required this.onAction});
}

class _ActionWidget extends ConsumerWidget {
  final BaseAction action;
  final Widget Function(_ActionWidgetScope context) builder;

  const _ActionWidget({required this.action, required this.builder});

  Future<void> _onAction(ActionScope scope) async {
    try {
      await action.onAction(scope);
    } catch (error, stackTrace) {
      handleError(scope.context, stack: stackTrace, description: 'Action failed: ${action.runtimeType}');
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authUser = ref.watch(currentUserProvider);
    if (authUser == null) {
      return const SizedBox.shrink();
    }

    final scope = ActionScope(context: context, ref: ref, authUser: authUser);
    if (!action.isVisible(scope)) {
      return const SizedBox.shrink();
    }

    return builder(.new(label: action.label(scope), onAction: () => _onAction(scope)));
  }
}

class ActionIconButtonWidget extends StatelessWidget {
  final BaseAction action;
  final ImmichVariant variant;

  const ActionIconButtonWidget({super.key, required this.action, this.variant = .ghost});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    builder: (ctx) => ImmichIconButton(icon: action.icon, onPressed: ctx.onAction, variant: variant),
  );
}

class ActionButtonWidget extends StatelessWidget {
  final BaseAction action;
  final ImmichVariant variant;

  const ActionButtonWidget({super.key, required this.action, this.variant = .ghost});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    builder: (ctx) =>
        ImmichTextButton(labelText: ctx.label, icon: action.icon, onPressed: ctx.onAction, variant: variant),
  );
}

class ActionColumnButtonWidget extends StatelessWidget {
  final BaseAction action;

  const ActionColumnButtonWidget({super.key, required this.action});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    builder: (ctx) => ImmichColumnButton(icon: action.icon, label: ctx.label, onPressed: ctx.onAction),
  );
}

class ActionMenuItemWidget extends StatelessWidget {
  final BaseAction action;

  const ActionMenuItemWidget({super.key, required this.action});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    builder: (ctx) => ImmichMenuItem(icon: action.icon, label: ctx.label, onPressed: ctx.onAction),
  );
}

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:immich_ui/immich_ui.dart';

class _ActionWidgetScope {
  final IconData icon;
  final String label;
  final FutureOr<void> Function() onAction;
  final FutureOr<void> Function()? onSecondaryAction;

  const _ActionWidgetScope({required this.icon, required this.label, required this.onAction, this.onSecondaryAction});
}

class _ActionWidget extends ConsumerWidget {
  final BaseAction action;
  final Widget Function(_ActionWidgetScope context) builder;

  const _ActionWidget({required this.action, required this.builder});

  Future<void> _guard(Future<void> Function() handler) async {
    try {
      await handler();
    } catch (error, stackTrace) {
      handleError(error, stack: stackTrace, description: 'Action failed: ${action.runtimeType}');
    }
  }

  Future<void> Function() get _onAction =>
      () => _guard(action.onAction);

  Future<void> Function()? get _onSecondaryAction {
    final onSecondaryAction = action.onSecondaryAction;
    if (onSecondaryAction == null) {
      return null;
    }

    return () => _guard(onSecondaryAction);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!action.isVisible) {
      return const SizedBox.shrink();
    }

    return builder(
      .new(icon: action.icon, label: action.label, onAction: _onAction, onSecondaryAction: _onSecondaryAction),
    );
  }
}

class ActionIconButtonWidget extends StatelessWidget {
  final BaseAction action;
  final ImmichVariant variant;

  const ActionIconButtonWidget({super.key, required this.action, this.variant = .ghost});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    builder: (ctx) =>
        ImmichIconButton(icon: ctx.icon, onPressed: ctx.onAction, onLongPress: ctx.onSecondaryAction, variant: variant),
  );
}

class ActionButtonWidget extends StatelessWidget {
  final BaseAction action;
  final ImmichVariant variant;

  const ActionButtonWidget({super.key, required this.action, this.variant = .ghost});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    builder: (ctx) => ImmichTextButton(
      labelText: ctx.label,
      icon: ctx.icon,
      onPressed: ctx.onAction,
      onLongPress: ctx.onSecondaryAction,
      variant: variant,
    ),
  );
}

class ActionColumnButtonWidget extends StatelessWidget {
  final BaseAction action;

  const ActionColumnButtonWidget({super.key, required this.action});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    builder: (ctx) => ImmichColumnButton(
      icon: ctx.icon,
      label: ctx.label,
      onPressed: ctx.onAction,
      onLongPress: ctx.onSecondaryAction,
    ),
  );
}

class ActionMenuItemWidget extends StatelessWidget {
  final BaseAction action;

  const ActionMenuItemWidget({super.key, required this.action});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    builder: (ctx) => ImmichMenuItem(icon: ctx.icon, label: ctx.label, onPressed: ctx.onAction),
  );
}

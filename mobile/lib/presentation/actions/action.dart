import 'package:flutter/widgets.dart' hide Action;

enum ActionDisplay { button, iconButton, menuItem, columnButton }

class Action {
  final IconData icon;
  final bool isVisible;
  final String label;
  final Future<void> Function() onAction;

  const Action({
    required this.icon,
    this.isVisible = true,
    required this.label,
    required this.onAction,
  });
}

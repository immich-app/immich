import 'package:flutter/material.dart';
import 'package:immich_ui/src/types.dart';

class ImmichIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;
  final ImmichVariant variant;
  final ImmichColor color;
  final bool disabled;

  const ImmichIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
    this.color = ImmichColor.primary,
    this.variant = ImmichVariant.filled,
    this.disabled = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final background = switch (variant) {
      ImmichVariant.filled => switch (color) {
          ImmichColor.primary => colorScheme.primary,
          ImmichColor.secondary => colorScheme.secondary,
        },
      ImmichVariant.ghost => Colors.transparent,
    };

    final foreground = switch (variant) {
      ImmichVariant.filled => switch (color) {
          ImmichColor.primary => colorScheme.onPrimary,
          ImmichColor.secondary => colorScheme.onSecondary,
        },
      ImmichVariant.ghost => switch (color) {
          ImmichColor.primary => colorScheme.primary,
          ImmichColor.secondary => colorScheme.secondary,
        },
    };

    final effectiveOnPressed = disabled ? null : onPressed;

    return IconButton(
      icon: Icon(icon),
      onPressed: effectiveOnPressed,
      style: IconButton.styleFrom(
        backgroundColor: background,
        foregroundColor: foreground,
      ),
    );
  }
}

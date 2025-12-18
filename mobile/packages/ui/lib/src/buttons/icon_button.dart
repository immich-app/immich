import 'package:flutter/material.dart';
import 'package:immich_ui/src/types.dart';

class ImmichIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final ImmichVariant variant;
  final ImmichColor color;

  const ImmichIconButton({
    super.key,
    required this.icon,
    required this.onTap,
    this.color = ImmichColor.primary,
    this.variant = ImmichVariant.filled,
  });

  @override
  Widget build(BuildContext context) {
    final background = switch (variant) {
      ImmichVariant.filled => switch (color) {
          ImmichColor.primary => Theme.of(context).colorScheme.primary,
          ImmichColor.secondary => Theme.of(context).colorScheme.secondary,
        },
      ImmichVariant.ghost => Colors.transparent,
    };

    final foreground = switch (variant) {
      ImmichVariant.filled => switch (color) {
          ImmichColor.primary => Theme.of(context).colorScheme.onPrimary,
          ImmichColor.secondary => Theme.of(context).colorScheme.onSecondary,
        },
      ImmichVariant.ghost => switch (color) {
          ImmichColor.primary => Theme.of(context).colorScheme.primary,
          ImmichColor.secondary => Theme.of(context).colorScheme.secondary,
        },
    };

    return IconButton(
      icon: Icon(icon),
      onPressed: onTap,
      style: IconButton.styleFrom(
        backgroundColor: background,
        foregroundColor: foreground,
      ),
    );
  }
}

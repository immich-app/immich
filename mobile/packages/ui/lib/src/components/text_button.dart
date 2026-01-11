import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_ui/src/constants.dart';
import 'package:immich_ui/src/types.dart';

class ImmichTextButton extends StatelessWidget {
  final String labelText;
  final IconData? icon;
  final FutureOr<void> Function() onPressed;
  final ImmichVariant variant;
  final ImmichColor color;
  final bool expanded;
  final bool loading;
  final bool disabled;

  const ImmichTextButton({
    super.key,
    required this.labelText,
    this.icon,
    required this.onPressed,
    this.variant = ImmichVariant.filled,
    this.color = ImmichColor.primary,
    this.expanded = true,
    this.loading = false,
    this.disabled = false,
  });

  Widget _buildButton(ImmichVariant variant) {
    final Widget? effectiveIcon = loading
        ? const SizedBox.square(
            dimension: ImmichIconSize.md,
            child: CircularProgressIndicator(strokeWidth: ImmichBorderWidth.lg),
          )
        : icon != null
            ? Icon(icon, fontWeight: FontWeight.w600)
            : null;
    final hasIcon = effectiveIcon != null;

    final label = Text(labelText, style: const TextStyle(fontSize: ImmichTextSize.body, fontWeight: FontWeight.bold));
    final style = ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: ImmichSpacing.md));

    final effectiveOnPressed = disabled || loading ? null : onPressed;

    switch (variant) {
      case ImmichVariant.filled:
        if (hasIcon) {
          return ElevatedButton.icon(
            style: style,
            onPressed: effectiveOnPressed,
            icon: effectiveIcon,
            label: label,
          );
        }

        return ElevatedButton(
          style: style,
          onPressed: effectiveOnPressed,
          child: label,
        );
      case ImmichVariant.ghost:
        if (hasIcon) {
          return TextButton.icon(
            style: style,
            onPressed: effectiveOnPressed,
            icon: effectiveIcon,
            label: label,
          );
        }

        return TextButton(
          style: style,
          onPressed: effectiveOnPressed,
          child: label,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final button = _buildButton(variant);
    if (expanded) {
      return SizedBox(width: double.infinity, child: button);
    }
    return button;
  }
}

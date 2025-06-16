import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

enum ButtonType { elevated, outlined, text, filled, filledTonal }

class ResponsiveButton extends StatelessWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final ButtonType type;
  final double? height;
  final double? maxWidth;
  final ButtonStyle? style;
  final Widget? icon;
  final bool isResponsive;

  const ResponsiveButton({
    super.key,
    required this.child,
    required this.onPressed,
    this.type = ButtonType.elevated,
    this.height = 42,
    this.maxWidth = 400,
    this.style,
    this.icon,
    this.isResponsive = true,
  });

  @override
  Widget build(BuildContext context) {
    final Widget button = switch (type) {
      ButtonType.elevated => icon != null
          ? ElevatedButton.icon(
              onPressed: onPressed,
              style: style,
              icon: icon!,
              label: child,
            )
          : ElevatedButton(
              onPressed: onPressed,
              style: style,
              child: child,
            ),
      ButtonType.outlined => icon != null
          ? OutlinedButton.icon(
              onPressed: onPressed,
              style: style,
              icon: icon!,
              label: child,
            )
          : OutlinedButton(
              onPressed: onPressed,
              style: style,
              child: child,
            ),
      ButtonType.text => icon != null
          ? TextButton.icon(
              onPressed: onPressed,
              style: style,
              icon: icon!,
              label: child,
            )
          : TextButton(
              onPressed: onPressed,
              style: style,
              child: child,
            ),
      ButtonType.filled => icon != null
          ? FilledButton.icon(
              onPressed: onPressed,
              style: style,
              icon: icon!,
              label: child,
            )
          : FilledButton(
              onPressed: onPressed,
              style: style,
              child: child,
            ),
      ButtonType.filledTonal => icon != null
          ? FilledButton.tonalIcon(
              onPressed: onPressed,
              style: style,
              icon: icon!,
              label: child,
            )
          : FilledButton.tonal(
              onPressed: onPressed,
              style: style,
              child: child,
            ),
    };

    if (!isResponsive) {
      return button;
    }

    return SizedBox(
      width: context.isMobile ? double.infinity : maxWidth,
      height: height,
      child: button,
    );
  }
}

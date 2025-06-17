import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class SettingCard extends StatelessWidget {
  const SettingCard({
    super.key,
    required this.child,
    this.margin = const EdgeInsets.symmetric(horizontal: 16),
    this.borderRadius = const BorderRadius.all(Radius.circular(16)),
    this.color,
    this.shadow,
  });

  final Widget child;
  final EdgeInsetsGeometry? margin;
  final BorderRadius borderRadius;
  final Color? color;
  final List<BoxShadow>? shadow;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: color ??
            context.colorScheme.surfaceContainerLowest.withValues(alpha: 0.6),
        borderRadius: borderRadius,
        border: Border.all(
          color: context.colorScheme.outlineVariant.withValues(alpha: 0.4),
          width: 0.5,
        ),
        boxShadow: shadow,
      ),
      child: ClipRRect(
        borderRadius: borderRadius,
        child: child,
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class SettingCard extends StatelessWidget {
  const SettingCard({
    super.key,
    required this.child,
    this.margin = const EdgeInsets.symmetric(horizontal: 16),
    this.borderRadius = const BorderRadius.all(Radius.circular(16)),
    this.gradient,
    this.color,
    this.shadow,
  });

  final Widget child;
  final EdgeInsetsGeometry? margin;
  final BorderRadius borderRadius;
  final Gradient? gradient;
  final Color? color;
  final List<BoxShadow>? shadow;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        gradient: gradient ??
            LinearGradient(
              colors: [
                context.colorScheme.surfaceContainerLow.withValues(alpha: 0.5),
                context.colorScheme.surfaceContainerLow.withValues(alpha: 0.7),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
        borderRadius: borderRadius,
        border: Border.all(
          color: context.colorScheme.outlineVariant.withValues(alpha: 0.4),
          width: 1,
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

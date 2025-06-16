import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

enum IndicatorState {
  enabled,
  disabled,
  neutral,
}

class SettingIndicatorSectionHeader extends StatelessWidget {
  const SettingIndicatorSectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.indicatorState = IndicatorState.neutral,
    this.padding,
  });

  final String title;

  final String? subtitle;

  final IndicatorState indicatorState;

  final EdgeInsetsGeometry? padding;

  Color _getIndicatorColor(BuildContext context) {
    switch (indicatorState) {
      case IndicatorState.enabled:
        return context.colorScheme.primary;
      case IndicatorState.disabled:
        return context.themeData.disabledColor;

      case IndicatorState.neutral:
        return Colors.transparent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (indicatorState != IndicatorState.neutral)
                Container(
                  width: 4,
                  height: 36,
                  decoration: BoxDecoration(
                    color: _getIndicatorColor(context),
                    borderRadius: const BorderRadius.all(Radius.circular(2)),
                  ),
                ),
              if (indicatorState != IndicatorState.neutral)
                const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: context.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                        color: context.colorScheme.onSurface,
                        letterSpacing: -0.25,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: context.textTheme.bodyMedium?.copyWith(
                          color: context.colorScheme.onSurfaceSecondary,
                          height: 1.4,
                          letterSpacing: 0,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class SettingSectionHeader extends StatelessWidget {
  const SettingSectionHeader({
    super.key,
    this.icon,
    required this.title,
    this.backgroundColor,
    this.iconBackgroundColor,
    this.textColor,
  });

  final IconData? icon;
  final String title;
  final Color? backgroundColor;
  final Color? iconBackgroundColor;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    final Color sectionBackgroundColor =
        backgroundColor ?? context.colorScheme.primary.withValues(alpha: 0.05);
    final Color iconContainerColor = iconBackgroundColor ??
        context.colorScheme.primary.withValues(alpha: 0.1);
    final Color titleTextColor = textColor ?? context.primaryColor;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: sectionBackgroundColor,
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
        child: Row(
          children: [
            if (icon != null) ...[
              DecoratedBox(
                decoration: BoxDecoration(
                  color: iconContainerColor,
                  borderRadius: const BorderRadius.all(Radius.circular(8)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(6.0),
                  child: Icon(
                    icon,
                    size: 16,
                    color: titleTextColor,
                  ),
                ),
              ),
              const SizedBox(width: 10),
            ],
            Text(
              title,
              style: context.textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w600,
                color: titleTextColor,
                letterSpacing: -0.25,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

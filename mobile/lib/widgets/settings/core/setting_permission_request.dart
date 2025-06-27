import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/widgets/common/responsive_button.dart';
import 'package:immich_mobile/widgets/settings/core/setting_card.dart';

class SettingPermissionRequest extends StatelessWidget {
  const SettingPermissionRequest({
    super.key,
    this.icon,
    required this.title,
    this.subtitle,
    required this.buttonText,
    required this.onHandleAction,
    this.buttonIcon,
    this.colorScheme = PermissionColorScheme.warning,
    this.useCard = true,
    this.padding = const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
  });

  final IconData? icon;

  final String title;

  final String? subtitle;

  final String buttonText;

  final IconData? buttonIcon;

  final VoidCallback onHandleAction;

  final PermissionColorScheme colorScheme;

  final bool useCard;

  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final cardContent = Padding(
      padding: padding,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _getIconBackgroundColor(context),
                borderRadius: const BorderRadius.all(Radius.circular(12)),
              ),
              child: Icon(
                icon!,
                size: 20,
                color: _getIconColor(context),
              ),
            ),
            const SizedBox(height: 16),
          ],
          Text(
            title,
            style: context.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: context.colorScheme.onSurface,
              letterSpacing: 0.1,
            ),
            textAlign: TextAlign.center,
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 8),
            Text(
              subtitle!,
              style: context.itemSubtitle,
              textAlign: TextAlign.center,
            ),
          ],
          const SizedBox(height: 16),
          ResponsiveButton(
            onPressed: onHandleAction,
            icon: buttonIcon != null ? Icon(buttonIcon, size: 20) : null,
            child: Text(
              buttonText,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );

    if (useCard) {
      return SettingCard(child: cardContent);
    } else {
      return cardContent;
    }
  }

  Color _getIconBackgroundColor(BuildContext context) {
    return switch (colorScheme) {
      PermissionColorScheme.primary =>
        context.colorScheme.primary.withValues(alpha: 0.1),
      PermissionColorScheme.secondary =>
        context.colorScheme.secondary.withValues(alpha: 0.12),
      PermissionColorScheme.error =>
        context.colorScheme.error.withValues(alpha: 0.1),
      PermissionColorScheme.warning =>
        context.colorScheme.tertiary.withValues(alpha: 0.1),
    };
  }

  Color _getIconColor(BuildContext context) {
    return switch (colorScheme) {
      PermissionColorScheme.primary => context.colorScheme.primary,
      PermissionColorScheme.secondary => context.colorScheme.secondary,
      PermissionColorScheme.error => context.colorScheme.error,
      PermissionColorScheme.warning => context.colorScheme.tertiary,
    };
  }
}

enum PermissionColorScheme {
  primary,
  secondary,
  error,
  warning,
}

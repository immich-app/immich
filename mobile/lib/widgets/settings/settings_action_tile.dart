import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

class SettingsActionTile extends StatelessWidget {
  const SettingsActionTile({
    super.key,
    required this.title,
    required this.subtitle,
    required this.onActionTap,
    this.statusText,
    this.statusColor,
    this.contentPadding,
    this.titleStyle,
    this.subtitleStyle,
  });

  final String title;
  final String subtitle;
  final String? statusText;
  final Color? statusColor;
  final VoidCallback onActionTap;
  final EdgeInsets? contentPadding;
  final TextStyle? titleStyle;
  final TextStyle? subtitleStyle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListTile(
      isThreeLine: true,
      onTap: onActionTap,
      titleAlignment: ListTileTitleAlignment.center,
      title: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: titleStyle ?? theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500, height: 1.5),
            ),
          ),
          if (statusText != null)
            Padding(
              padding: const EdgeInsets.only(left: 8),
              child: Chip(
                label: Text(
                  statusText!,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: statusColor ?? theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                backgroundColor: theme.colorScheme.surface,
                side: BorderSide(color: statusColor ?? theme.colorScheme.outlineVariant),
                shape: StadiumBorder(side: BorderSide(color: statusColor ?? theme.colorScheme.outlineVariant)),
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
              ),
            ),
        ],
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 4.0, right: 18.0),
        child: Text(
          subtitle,
          style: subtitleStyle ?? theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceSecondary),
        ),
      ),
      trailing: Icon(Icons.arrow_forward_ios, size: 16, color: theme.colorScheme.onSurfaceVariant),
      contentPadding: contentPadding ?? const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
    );
  }
}

import 'package:flutter/widgets.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

class SettingGroupTitle extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;
  final EdgeInsetsGeometry? contentPadding;

  const SettingGroupTitle({super.key, required this.title, this.icon, this.subtitle, this.contentPadding});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: contentPadding ?? const EdgeInsets.only(left: 20.0, right: 20.0, bottom: 8.0),
      child: Column(
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Icon(icon, color: context.colorScheme.onSurfaceSecondary, size: 20),
                const SizedBox(width: 8),
              ],
              Text(title, style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary)),
            ],
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 8),
            Text(
              subtitle!,
              style: context.textTheme.bodyMedium!.copyWith(color: context.colorScheme.onSurface.withAlpha(200)),
            ),
          ],
        ],
      ),
    );
  }
}

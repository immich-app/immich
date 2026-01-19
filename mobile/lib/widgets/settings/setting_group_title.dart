import 'package:flutter/widgets.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class SettingGroupTitle extends StatelessWidget {
  final String title;
  final IconData? icon;

  const SettingGroupTitle({super.key, required this.title, this.icon});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (icon != null) ...[
          Icon(icon, color: context.colorScheme.onSurface.withValues(alpha: 0.7), size: 20),
          const SizedBox(width: 8),
        ],
        Text(title, style: context.textTheme.bodyMedium!.copyWith(color: context.colorScheme.onSurfaceVariant)),
      ],
    );
  }
}

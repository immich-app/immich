import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';

class SettingInfo extends StatelessWidget {
  const SettingInfo({
    super.key,
    required this.text,
    this.icon,
    this.textColor,
    this.padding = EdgeInsets.zero,
  });

  final String text;

  final IconData? icon;

  final Color? textColor;

  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: 20,
              color: textColor ??
                  context.colorScheme.onSurface.withValues(alpha: 0.7),
            ),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Text(
              text.t(context: context),
              style: context.itemSubtitle.copyWith(
                color: textColor ?? context.colorScheme.onSurfaceSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

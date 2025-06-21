import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';

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
        backgroundColor ?? context.colorScheme.primary.withValues(alpha: 0.06);
    final Color iconContainerColor = iconBackgroundColor ??
        context.colorScheme.primary.withValues(alpha: 0.12);
    final Color titleTextColor = textColor ?? context.primaryColor;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: sectionBackgroundColor,
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
        child: Row(
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                color: iconContainerColor,
                borderRadius: const BorderRadius.all(Radius.circular(8)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(6.0),
                child: Icon(
                  icon ?? Icons.toggle_off,
                  size: 20,
                  color: titleTextColor.withValues(alpha: 0.8),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title.t(context: context),
                style: context.sectionTitle.copyWith(
                  color: titleTextColor,
                ),
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

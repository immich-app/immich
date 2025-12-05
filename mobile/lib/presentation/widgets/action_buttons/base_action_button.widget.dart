import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class BaseActionButton extends StatelessWidget {
  const BaseActionButton({
    super.key,
    required this.label,
    required this.iconData,
    this.iconColor,
    this.onPressed,
    this.onLongPressed,
    this.maxWidth = 90.0,
    this.minWidth,
    this.iconOnly = false,
    this.menuItem = false,
  });

  final String label;
  final IconData iconData;
  final Color? iconColor;
  final double maxWidth;
  final double? minWidth;

  /// When true, renders only an IconButton without text label
  final bool iconOnly;

  /// When true, renders as a MenuItemButton for use in MenuAnchor menus
  final bool menuItem;
  final void Function()? onPressed;
  final void Function()? onLongPressed;

  @override
  Widget build(BuildContext context) {
    final miniWidth = minWidth ?? (context.isMobile ? context.width / 4.5 : 75.0);
    final iconTheme = IconTheme.of(context);
    final iconSize = iconTheme.size ?? 24.0;
    final iconColor = this.iconColor ?? iconTheme.color ?? context.themeData.iconTheme.color;
    final textColor = context.themeData.textTheme.labelLarge?.color;

    if (iconOnly) {
      return IconButton(
        onPressed: onPressed,
        icon: Icon(iconData, size: iconSize, color: iconColor),
      );
    }

    if (menuItem) {
      final theme = context.themeData;
      final effectiveStyle = theme.textTheme.labelLarge;
      final effectiveIconColor = iconColor ?? theme.iconTheme.color ?? theme.colorScheme.onSurfaceVariant;

      return MenuItemButton(
        style: MenuItemButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
        leadingIcon: Icon(iconData, color: effectiveIconColor, size: 20),
        onPressed: onPressed,
        child: Text(label, style: effectiveStyle),
      );
    }

    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: maxWidth),
      child: MaterialButton(
        padding: const EdgeInsets.all(10),
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(20))),
        textColor: textColor,
        onPressed: onPressed,
        onLongPress: onLongPressed,
        minWidth: miniWidth,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(iconData, size: iconSize, color: iconColor),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(fontSize: 14.0, fontWeight: FontWeight.w400),
              maxLines: 3,
              textAlign: TextAlign.center,
              softWrap: true,
            ),
          ],
        ),
      ),
    );
  }
}

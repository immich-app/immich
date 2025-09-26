import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class SearchFilterChip extends StatelessWidget {
  final String label;
  final Function() onTap;
  final Widget? currentFilter;
  final IconData icon;
  final bool disabled;

  const SearchFilterChip({
    super.key,
    required this.label,
    required this.onTap,
    required this.icon,
    this.currentFilter,
    this.disabled = false,
  });

  @override
  Widget build(BuildContext context) {
    if (currentFilter != null && !disabled) {
      return GestureDetector(
        onTap: disabled ? null : onTap,
        child: Card(
          elevation: 0,
          color: disabled
              ? context.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3)
              : context.primaryColor.withValues(alpha: .5),
          shape: StadiumBorder(
            side: BorderSide(
              color: disabled
                  ? context.colorScheme.outline.withValues(alpha: 0.3)
                  : context.colorScheme.secondaryContainer,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 2.0, horizontal: 14.0),
            child: Row(
              children: [
                Icon(icon, size: 18, color: disabled ? context.colorScheme.onSurface.withValues(alpha: 0.4) : null),
                const SizedBox(width: 4.0),
                DefaultTextStyle(
                  style: TextStyle(color: disabled ? context.colorScheme.onSurface.withValues(alpha: 0.4) : null),
                  child: currentFilter!,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: Card(
        elevation: 0,
        color: disabled ? context.colorScheme.surfaceContainerHighest.withValues(alpha: 0.2) : null,
        shape: StadiumBorder(
          side: BorderSide(
            color: disabled
                ? context.colorScheme.outline.withValues(alpha: 0.3)
                : context.colorScheme.outline.withAlpha(15),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 2.0, horizontal: 14.0),
          child: Row(
            children: [
              Icon(icon, size: 18, color: disabled ? context.colorScheme.onSurface.withValues(alpha: 0.4) : null),
              const SizedBox(width: 4.0),
              Text(
                label,
                style: TextStyle(color: disabled ? context.colorScheme.onSurface.withValues(alpha: 0.4) : null),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

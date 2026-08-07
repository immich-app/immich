import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class SearchFilterChip extends StatelessWidget {
  final String label;
  final Function() onTap;
  final Widget? currentFilter;
  final IconData icon;
  final bool isEnabled;

  const SearchFilterChip({super.key, required this.label, required this.onTap, required this.icon, this.currentFilter, this.isEnabled = true});

  @override
  Widget build(BuildContext context) {
    Widget child;
    if (currentFilter != null) {
      child = GestureDetector(
        onTap: isEnabled ? onTap : null,
        child: Card(
          elevation: 0,
          color: context.colorScheme.secondaryContainer,
          shape: StadiumBorder(side: BorderSide(color: context.colorScheme.secondaryContainer)),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 2.0, horizontal: 14.0),
            child: Row(children: [Icon(icon, size: 18), const SizedBox(width: 4.0), currentFilter!]),
          ),
        ),
      );
    } else {
      child = GestureDetector(
        onTap: isEnabled ? onTap : null,
        child: Card(
          elevation: 0,
          shape: StadiumBorder(side: BorderSide(color: context.colorScheme.outline.withAlpha(15))),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 2.0, horizontal: 14.0),
            child: Row(
              children: [
                Icon(icon, size: 18),
                const SizedBox(width: 4.0),
                Text(label, style: TextStyle(color: context.colorScheme.onSecondaryContainer)),
              ],
            ),
          ),
        ),
      );
    }
    
    if (!isEnabled) {
      return Opacity(opacity: 0.5, child: child);
    }
    return child;
  }
}

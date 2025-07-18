import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

class EntitiyCountTile extends StatelessWidget {
  final int count;
  final String label;
  final IconData icon;

  const EntitiyCountTile({
    super.key,
    required this.count,
    required this.label,
    required this.icon,
  });

  String zeroPadding(int number) {
    return number.toString().length < 12
        ? "0" * (12 - number.toString().length)
        : "";
  }

  @override
  Widget build(BuildContext context) {
    return IntrinsicWidth(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.colorScheme.surfaceContainer,
          borderRadius: const BorderRadius.all(Radius.circular(16)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon and Label
            Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Icon(
                  icon,
                  color: context.primaryColor,
                ),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: TextStyle(
                    color: context.primaryColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Number
            RichText(
              text: TextSpan(
                style: const TextStyle(
                  fontSize: 20,
                  fontFamily: 'Courier',
                ),
                children: [
                  TextSpan(
                    text: zeroPadding(count),
                    style: TextStyle(
                      color: context.colorScheme.onSurfaceSecondary,
                    ),
                  ),
                  TextSpan(
                    text: count.toString(),
                    style: TextStyle(
                      color: context.primaryColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

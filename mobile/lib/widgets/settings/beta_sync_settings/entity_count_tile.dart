import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

class EntitiyCountTile extends StatelessWidget {
  final int count;
  final String label;
  final IconData icon;

  const EntitiyCountTile({super.key, required this.count, required this.label, required this.icon});

  String zeroPadding(int number, int targetWidth) {
    final numStr = number.toString();
    return numStr.length < targetWidth ? "0" * (targetWidth - numStr.length) : "";
  }

  int calculateMaxDigits(double availableWidth) {
    const double charWidth = 11.0;
    return (availableWidth / charWidth).floor().clamp(1, 8);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.colorScheme.surfaceContainerLow,
        borderRadius: const BorderRadius.all(Radius.circular(16)),
        border: Border.all(width: 0.5, color: context.colorScheme.outline.withAlpha(25)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Icon and Label
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              Icon(icon, color: context.primaryColor),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Number
          LayoutBuilder(
            builder: (context, constraints) {
              final maxDigits = calculateMaxDigits(constraints.maxWidth);
              return RichText(
                text: TextSpan(
                  style: const TextStyle(fontSize: 18, fontFamily: 'OverpassMono', fontWeight: FontWeight.w600),
                  children: [
                    TextSpan(
                      text: zeroPadding(count, maxDigits),
                      style: TextStyle(color: context.colorScheme.onSurfaceSecondary.withAlpha(75)),
                    ),
                    TextSpan(
                      text: count.toString(),
                      style: TextStyle(color: context.primaryColor),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

class SettingSliderListTile extends StatelessWidget {
  const SettingSliderListTile({
    super.key,
    required this.title,
    this.subtitle,
    required this.valueNotifier,
    this.onChangeEnd,
    this.min = 0,
    required this.max,
    this.divisions,
    this.label,
    this.enabled = true,
    this.activeColor,
    this.showValue = false,
    this.valueFormatter,
    this.padding,
  });

  final String title;

  final String? subtitle;

  final ValueNotifier<int> valueNotifier;

  final Function(int)? onChangeEnd;

  final double min;

  final double max;

  final int? divisions;

  final String? label;

  final bool enabled;

  final Color? activeColor;

  final bool showValue;

  final String Function(double)? valueFormatter;

  final EdgeInsetsGeometry? padding;

  String _formatValue(double value) {
    if (valueFormatter != null) {
      return valueFormatter!(value);
    }
    if (divisions != null) {
      return value.toInt().toString();
    }
    return value.toStringAsFixed(1);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: context.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                        color: enabled ? null : context.themeData.disabledColor,
                        letterSpacing: 0,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle!,
                        style: context.textTheme.bodyMedium?.copyWith(
                          letterSpacing: 0,
                          height: 1.4,
                          color: enabled
                              ? context.colorScheme.onSurfaceSecondary
                              : context.themeData.disabledColor,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (showValue) ...[
                const SizedBox(width: 16),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: (activeColor ?? context.colorScheme.primary)
                        .withValues(alpha: 0.1),
                    borderRadius: const BorderRadius.all(
                      Radius.circular(6),
                    ),
                    border: Border.all(
                      color: (activeColor ?? context.colorScheme.primary)
                          .withValues(alpha: 0.2),
                    ),
                  ),
                  child: Text(
                    _formatValue(valueNotifier.value.toDouble()),
                    style: context.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: activeColor ?? context.colorScheme.primary,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              year2023: false,
              trackHeight: 4,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
              overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
            ),
            child: Slider(
              value: valueNotifier.value.toDouble(),
              onChanged: enabled
                  ? (double v) => valueNotifier.value = v.toInt()
                  : null,
              onChangeEnd:
                  enabled ? (double v) => onChangeEnd?.call(v.toInt()) : null,
              min: min,
              max: max,
              divisions: divisions,
              label: label ?? _formatValue(valueNotifier.value.toDouble()),
            ),
          ),
        ],
      ),
    );
  }
}

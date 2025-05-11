import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class SettingsSliderListTile extends StatelessWidget {
  final ValueNotifier<int> valueNotifier;
  final String text;
  final double maxValue;
  final double minValue;
  final int noDivisons;
  final String? label;
  final bool enabled;
  final Function(int)? onChangeEnd;

  const SettingsSliderListTile({
    required this.valueNotifier,
    required this.text,
    required this.maxValue,
    this.minValue = 0.0,
    required this.noDivisons,
    this.enabled = true,
    this.label,
    this.onChangeEnd,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      dense: true,
      title: Text(
        text,
        style: context.textTheme.bodyLarge?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Slider(
        value: valueNotifier.value.toDouble(),
        onChanged: (double v) => valueNotifier.value = v.toInt(),
        onChangeEnd: (double v) => onChangeEnd?.call(v.toInt()),
        max: maxValue,
        min: minValue,
        divisions: noDivisons,
        label: label ?? "${valueNotifier.value}",
        activeColor: context.primaryColor,
      ),
    );
  }
}

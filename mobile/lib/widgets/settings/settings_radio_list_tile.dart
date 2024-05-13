import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class SettingsRadioGroup<T> {
  final String title;
  final T value;

  SettingsRadioGroup({required this.title, required this.value});
}

class SettingsRadioListTile<T> extends StatelessWidget {
  final List<SettingsRadioGroup> groups;
  final T groupBy;
  final void Function(T?) onRadioChanged;

  const SettingsRadioListTile({
    super.key,
    required this.groups,
    required this.groupBy,
    required this.onRadioChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: groups
          .map(
            (g) => RadioListTile<T>(
              contentPadding: const EdgeInsets.symmetric(horizontal: 20),
              dense: true,
              activeColor: context.primaryColor,
              title: Text(
                g.title,
                style: context.textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
              value: g.value,
              groupValue: groupBy,
              onChanged: onRadioChanged,
              controlAffinity: ListTileControlAffinity.trailing,
            ),
          )
          .toList(),
    );
  }
}

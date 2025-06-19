import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/utils/fade_on_tap.dart';

class SettingsRadioGroup<T> {
  const SettingsRadioGroup({
    required this.title,
    required this.value,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final T value;
}

class SettingRadioListTile<T> extends StatelessWidget {
  const SettingRadioListTile({
    super.key,
    required this.groups,
    required this.groupBy,
    required this.onRadioChanged,
    this.contentPadding,
  });

  final List<SettingsRadioGroup<T>> groups;

  final T groupBy;

  final void Function(T?) onRadioChanged;

  final EdgeInsetsGeometry? contentPadding;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: groups
          .map(
            (group) => FadeOnTap(
              onTap: () => onRadioChanged(group.value),
              child: ListTile(
                contentPadding: contentPadding,
                dense: true,
                title: Text(group.title, style: context.itemTitle),
                subtitle: group.subtitle != null
                    ? Text(
                        group.subtitle!,
                        style: context.itemSubtitle,
                      )
                    : null,
                trailing: Radio<T>(
                  value: group.value,
                  groupValue: groupBy,
                  onChanged: onRadioChanged,
                  activeColor: context.primaryColor,
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

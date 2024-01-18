import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import 'package:immich_mobile/extensions/build_context_extensions.dart';

class MapSettingsListTile extends StatelessWidget {
  final String title;
  final bool selected;
  final Function(bool) onChanged;

  const MapSettingsListTile({
    super.key,
    required this.title,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SwitchListTile.adaptive(
      activeColor: context.primaryColor,
      title: Text(
        title,
        style:
            context.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold),
      ).tr(),
      value: selected,
      onChanged: onChanged,
    );
  }
}

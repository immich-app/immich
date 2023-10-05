import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class SettingsSwitchListTile extends StatelessWidget {
  final AppSettingsService appSettingService;
  final ValueNotifier<bool> valueNotifier;
  final AppSettingsEnum settingsEnum;
  final String title;
  final bool enabled;
  final String? subtitle;
  final Function(bool)? onChanged;

  SettingsSwitchListTile({
    required this.appSettingService,
    required this.valueNotifier,
    required this.settingsEnum,
    required this.title,
    this.subtitle,
    this.enabled = true,
    this.onChanged,
  }) : super(key: Key(settingsEnum.name));

  @override
  Widget build(BuildContext context) {
    return SwitchListTile.adaptive(
      selectedTileColor: enabled ? null : Theme.of(context).disabledColor,
      value: valueNotifier.value,
      onChanged: (bool value) {
        if (enabled) {
          valueNotifier.value = value;
          appSettingService.setSetting(settingsEnum, value);
        }
        if (onChanged != null) {
          onChanged!(value);
        }
      },
      activeColor: enabled
          ? Theme.of(context).primaryColor
          : Theme.of(context).disabledColor,
      dense: true,
      title: Text(
        title,
        style: Theme.of(context)
            .textTheme
            .labelLarge
            ?.copyWith(fontWeight: FontWeight.bold),
      ),
      subtitle: subtitle != null ? Text(subtitle!) : null,
    );
  }
}

import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class SettingsSwitchListTile extends StatelessWidget {
  final AppSettingsService appSettingService;
  final ValueNotifier<bool> valueNotifier;
  final AppSettingsEnum settingsEnum;
  final String title;
  final bool enabled;
  final String? subtitle;

  SettingsSwitchListTile({
    required this.appSettingService,
    required this.valueNotifier,
    required this.settingsEnum,
    required this.title,
    this.subtitle,
    this.enabled = true,
  }) : super(key: Key(settingsEnum.name));

  @override
  Widget build(BuildContext context) {
    return SwitchListTile.adaptive(
      value: valueNotifier.value,
      onChanged: !enabled
          ? null
          : (value) {
              valueNotifier.value = value;
              appSettingService.setSetting(settingsEnum, value);
            },
      activeColor: Theme.of(context).primaryColor,
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

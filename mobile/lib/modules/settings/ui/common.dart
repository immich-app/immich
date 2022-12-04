import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

SwitchListTile buildSwitchListTile(
  BuildContext context,
  AppSettingsService appSettingService,
  ValueNotifier<bool> valueNotifier,
  AppSettingsEnum settingsEnum, {
  required String title,
  String? subtitle,
}) {
  return SwitchListTile.adaptive(
    key: Key(settingsEnum.name),
    value: valueNotifier.value,
    onChanged: (value) {
      valueNotifier.value = value;
      appSettingService.setSetting(settingsEnum, value);
    },
    activeColor: Theme.of(context).primaryColor,
    dense: true,
    title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
    subtitle: subtitle != null ? Text(subtitle) : null,
  );
}

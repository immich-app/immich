import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'theme.provider.g.dart';

@Riverpod(keepAlive: true)
class ImmichTheme extends _$ImmichTheme {
  @override
  ThemeMode build() {
    final themeMode = ref
        .watch(appSettingsServiceProvider)
        .getSetting(AppSettingsEnum.themeMode);

    switch (themeMode) {
      case "light":
        return ThemeMode.light;
      case "dark":
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  void updateTheme(ThemeMode newMode) => state = newMode;
}

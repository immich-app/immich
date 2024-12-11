import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/theme/color_scheme.dart';
import 'package:immich_mobile/theme/theme_data.dart';
import 'package:immich_mobile/theme/dynamic_theme.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

final immichThemeModeProvider = StateProvider<ThemeMode>((ref) {
  final themeMode = ref
      .watch(appSettingsServiceProvider)
      .getSetting(AppSettingsEnum.themeMode);

  debugPrint("Current themeMode $themeMode");

  if (themeMode == ThemeMode.light.name) {
    return ThemeMode.light;
  } else if (themeMode == ThemeMode.dark.name) {
    return ThemeMode.dark;
  } else {
    return ThemeMode.system;
  }
});

final immichThemePresetProvider = StateProvider<ImmichColorPreset>((ref) {
  final appSettingsProvider = ref.watch(appSettingsServiceProvider);
  final primaryColorPreset =
      appSettingsProvider.getSetting(AppSettingsEnum.primaryColor);

  debugPrint("Current theme preset $primaryColorPreset");

  try {
    return ImmichColorPreset.values
        .firstWhere((e) => e.name == primaryColorPreset);
  } catch (e) {
    debugPrint(
      "Theme preset $primaryColorPreset not found. Applying default preset.",
    );
    appSettingsProvider.setSetting(
      AppSettingsEnum.primaryColor,
      defaultColorPresetName,
    );
    return defaultColorPreset;
  }
});

final dynamicThemeSettingProvider = StateProvider<bool>((ref) {
  return ref
      .watch(appSettingsServiceProvider)
      .getSetting(AppSettingsEnum.dynamicTheme);
});

final colorfulInterfaceSettingProvider = StateProvider<bool>((ref) {
  return ref
      .watch(appSettingsServiceProvider)
      .getSetting(AppSettingsEnum.colorfulInterface);
});

// Provider for current selected theme
final immichThemeProvider = StateProvider<ImmichTheme>((ref) {
  final primaryColorPreset = ref.read(immichThemePresetProvider);
  final useSystemColor = ref.watch(dynamicThemeSettingProvider);
  final useColorfulInterface = ref.watch(colorfulInterfaceSettingProvider);
  final ImmichTheme? dynamicTheme = DynamicTheme.theme;
  final currentTheme = (useSystemColor && dynamicTheme != null)
      ? dynamicTheme
      : primaryColorPreset.themeOfPreset;

  return useColorfulInterface
      ? currentTheme
      : decolorizeSurfaces(theme: currentTheme);
});

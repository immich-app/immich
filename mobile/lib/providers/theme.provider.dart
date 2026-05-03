import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/theme/color_scheme.dart';
import 'package:immich_mobile/theme/dynamic_theme.dart';
import 'package:immich_mobile/theme/theme_data.dart';

final immichThemeModeProvider = StateProvider<ThemeMode>((ref) => ref.watch(appConfigProvider).theme.mode);

final immichThemePresetProvider = StateProvider<ImmichColorPreset>(
  (ref) => ref.watch(appConfigProvider.select((config) => config.theme.primaryColor)),
);

final dynamicThemeSettingProvider = StateProvider<bool>(
  (ref) => ref.watch(appConfigProvider.select((config) => config.theme.dynamicTheme)),
);

final colorfulInterfaceSettingProvider = StateProvider<bool>(
  (ref) => ref.watch(appConfigProvider.select((config) => config.theme.colorfulInterface)),
);

// Provider for current selected theme
final immichThemeProvider = StateProvider<ImmichTheme>((ref) {
  final primaryColorPreset = ref.watch(immichThemePresetProvider);
  final useSystemColor = ref.watch(dynamicThemeSettingProvider);
  final useColorfulInterface = ref.watch(colorfulInterfaceSettingProvider);
  final ImmichTheme? dynamicTheme = DynamicTheme.theme;
  final currentTheme = (useSystemColor && dynamicTheme != null) ? dynamicTheme : primaryColorPreset.themeOfPreset;

  return useColorfulInterface ? currentTheme : decolorizeSurfaces(theme: currentTheme);
});

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/theme/color_scheme.dart';
import 'package:immich_mobile/theme/dynamic_theme.dart';
import 'package:immich_mobile/theme/theme_data.dart';

// Provider for current selected theme
final immichThemeProvider = StateProvider<ImmichTheme>((ref) {
  final themeConfig = ref.watch(appConfigProvider.select((config) => config.theme));

  final ImmichTheme? dynamicTheme = DynamicTheme.theme;
  final currentTheme = (themeConfig.dynamicTheme && dynamicTheme != null)
      ? dynamicTheme
      : themeConfig.primaryColor.themeOfPreset;

  return themeConfig.colorfulInterface ? currentTheme : decolorizeSurfaces(theme: currentTheme);
});

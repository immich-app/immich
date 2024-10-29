import 'package:dynamic_color/dynamic_color.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/immich_colors.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

class ImmichTheme {
  ColorScheme light;
  ColorScheme dark;

  ImmichTheme({required this.light, required this.dark});
}

ImmichTheme? _immichDynamicTheme;
bool get isDynamicThemeAvailable => _immichDynamicTheme != null;

final immichThemeModeProvider = StateProvider<ThemeMode>((ref) {
  var themeMode = ref
      .watch(appSettingsServiceProvider)
      .getSetting(AppSettingsEnum.themeMode);

  debugPrint("Current themeMode $themeMode");

  if (themeMode == "light") {
    return ThemeMode.light;
  } else if (themeMode == "dark") {
    return ThemeMode.dark;
  } else {
    return ThemeMode.system;
  }
});

final immichThemePresetProvider = StateProvider<ImmichColorPreset>((ref) {
  var appSettingsProvider = ref.watch(appSettingsServiceProvider);
  var primaryColorName =
      appSettingsProvider.getSetting(AppSettingsEnum.primaryColor);

  debugPrint("Current theme preset $primaryColorName");

  try {
    return ImmichColorPreset.values
        .firstWhere((e) => e.name == primaryColorName);
  } catch (e) {
    debugPrint(
      "Theme preset $primaryColorName not found. Applying default preset.",
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
  var primaryColor = ref.read(immichThemePresetProvider);
  var useSystemColor = ref.watch(dynamicThemeSettingProvider);
  var useColorfulInterface = ref.watch(colorfulInterfaceSettingProvider);

  var currentTheme = (useSystemColor && _immichDynamicTheme != null)
      ? _immichDynamicTheme!
      : primaryColor.getTheme();

  return useColorfulInterface
      ? currentTheme
      : _decolorizeSurfaces(theme: currentTheme);
});

// Method to fetch dynamic system colors
Future<void> fetchSystemPalette() async {
  try {
    final corePalette = await DynamicColorPlugin.getCorePalette();
    if (corePalette != null) {
      final primaryColor = corePalette.toColorScheme().primary;
      debugPrint('dynamic_color: Core palette detected.');

      // Some palettes do not generate surface container colors accurately,
      // so we regenerate all colors using the primary color
      _immichDynamicTheme = ImmichTheme(
        light: ColorScheme.fromSeed(
          seedColor: primaryColor,
          brightness: Brightness.light,
        ),
        dark: ColorScheme.fromSeed(
          seedColor: primaryColor,
          brightness: Brightness.dark,
        ),
      );
    }
  } catch (e) {
    debugPrint('dynamic_color: Failed to obtain core palette.');
  }
}

// This method replaces all surface shades in ImmichTheme to a static ones
// as we are creating the colorscheme through seedColor the default surfaces are
// tinted with primary color
ImmichTheme _decolorizeSurfaces({
  required ImmichTheme theme,
}) {
  return ImmichTheme(
    light: theme.light.copyWith(
      surface: const Color(0xFFf9f9f9),
      onSurface: const Color(0xFF1b1b1b),
      surfaceContainerLowest: const Color(0xFFffffff),
      surfaceContainerLow: const Color(0xFFf3f3f3),
      surfaceContainer: const Color(0xFFeeeeee),
      surfaceContainerHigh: const Color(0xFFe8e8e8),
      surfaceContainerHighest: const Color(0xFFe2e2e2),
      surfaceDim: const Color(0xFFdadada),
      surfaceBright: const Color(0xFFf9f9f9),
      onSurfaceVariant: const Color(0xFF4c4546),
      inverseSurface: const Color(0xFF303030),
      onInverseSurface: const Color(0xFFf1f1f1),
    ),
    dark: theme.dark.copyWith(
      surface: const Color(0xFF131313),
      onSurface: const Color(0xFFE2E2E2),
      surfaceContainerLowest: const Color(0xFF0E0E0E),
      surfaceContainerLow: const Color(0xFF1B1B1B),
      surfaceContainer: const Color(0xFF1F1F1F),
      surfaceContainerHigh: const Color(0xFF242424),
      surfaceContainerHighest: const Color(0xFF2E2E2E),
      surfaceDim: const Color(0xFF131313),
      surfaceBright: const Color(0xFF353535),
      onSurfaceVariant: const Color(0xFFCfC4C5),
      inverseSurface: const Color(0xFFE2E2E2),
      onInverseSurface: const Color(0xFF303030),
    ),
  );
}

ThemeData getThemeData({required ColorScheme colorScheme}) {
  var isDark = colorScheme.brightness == Brightness.dark;
  var primaryColor = colorScheme.primary;

  return ThemeData(
    useMaterial3: true,
    brightness: isDark ? Brightness.dark : Brightness.light,
    colorScheme: colorScheme,
    primaryColor: primaryColor,
    hintColor: colorScheme.onSurfaceSecondary,
    focusColor: primaryColor,
    scaffoldBackgroundColor: colorScheme.surface,
    splashColor: primaryColor.withOpacity(0.1),
    highlightColor: primaryColor.withOpacity(0.1),
    dialogBackgroundColor: colorScheme.surfaceContainer,
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: colorScheme.surfaceContainer,
    ),
    fontFamily: 'Overpass',
    snackBarTheme: SnackBarThemeData(
      contentTextStyle: TextStyle(
        fontFamily: 'Overpass',
        color: primaryColor,
        fontWeight: FontWeight.bold,
      ),
      backgroundColor: colorScheme.surfaceContainerHighest,
    ),
    appBarTheme: AppBarTheme(
      titleTextStyle: TextStyle(
        color: primaryColor,
        fontFamily: 'Overpass',
        fontWeight: FontWeight.bold,
        fontSize: 18,
      ),
      backgroundColor:
          isDark ? colorScheme.surfaceContainer : colorScheme.surface,
      foregroundColor: primaryColor,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
    ),
    textTheme: TextTheme(
      displayLarge: TextStyle(
        fontSize: 26,
        fontWeight: FontWeight.bold,
      ),
      displayMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.bold,
      ),
      displaySmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
      ),
      titleSmall: const TextStyle(
        fontSize: 16.0,
        fontWeight: FontWeight.bold,
      ),
      titleMedium: const TextStyle(
        fontSize: 18.0,
        fontWeight: FontWeight.bold,
      ),
      titleLarge: const TextStyle(
        fontSize: 26.0,
        fontWeight: FontWeight.bold,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: isDark ? Colors.black87 : Colors.white,
      ),
    ),
    chipTheme: const ChipThemeData(
      side: BorderSide.none,
    ),
    sliderTheme: const SliderThemeData(
      thumbShape: RoundSliderThumbShape(enabledThumbRadius: 7),
      trackHeight: 2.0,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      type: BottomNavigationBarType.fixed,
    ),
    popupMenuTheme: const PopupMenuThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor:
          isDark ? colorScheme.surfaceContainer : colorScheme.surface,
      labelTextStyle: const WidgetStatePropertyAll(
        TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      focusedBorder: OutlineInputBorder(
        borderSide: BorderSide(
          color: primaryColor,
        ),
        borderRadius: const BorderRadius.all(Radius.circular(15)),
      ),
      enabledBorder: OutlineInputBorder(
        borderSide: BorderSide(
          color: colorScheme.outlineVariant,
        ),
        borderRadius: const BorderRadius.all(Radius.circular(15)),
      ),
      labelStyle: TextStyle(
        color: primaryColor,
      ),
      hintStyle: const TextStyle(
        fontSize: 14.0,
        fontWeight: FontWeight.normal,
      ),
    ),
    textSelectionTheme: TextSelectionThemeData(
      cursorColor: primaryColor,
    ),
    dropdownMenuTheme: DropdownMenuThemeData(
      menuStyle: MenuStyle(
        shape: WidgetStatePropertyAll<OutlinedBorder>(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(
            color: primaryColor,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(
            color: colorScheme.outlineVariant,
          ),
          borderRadius: const BorderRadius.all(Radius.circular(15)),
        ),
        labelStyle: TextStyle(
          color: primaryColor,
        ),
        hintStyle: const TextStyle(
          fontSize: 14.0,
          fontWeight: FontWeight.normal,
        ),
      ),
    ),
  );
}

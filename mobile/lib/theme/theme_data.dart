import 'package:flutter/material.dart';

import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

class ImmichTheme {
  final ColorScheme light;
  final ColorScheme dark;

  const ImmichTheme({required this.light, required this.dark});
}

ThemeData getThemeData({
  required ColorScheme colorScheme,
  required Locale locale,
}) {
  final isDark = colorScheme.brightness == Brightness.dark;

  return ThemeData(
    useMaterial3: true,
    brightness: colorScheme.brightness,
    colorScheme: colorScheme,
    primaryColor: colorScheme.primary,
    hintColor: colorScheme.onSurfaceSecondary,
    focusColor: colorScheme.primary,
    scaffoldBackgroundColor: colorScheme.surface,
    splashColor: colorScheme.primary.withValues(alpha: 0.1),
    highlightColor: colorScheme.primary.withValues(alpha: 0.1),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: colorScheme.surfaceContainer,
    ),
    fontFamily: _getFontFamilyFromLocale(locale),
    snackBarTheme: SnackBarThemeData(
      contentTextStyle: TextStyle(
        fontFamily: _getFontFamilyFromLocale(locale),
        color: colorScheme.primary,
        fontWeight: FontWeight.bold,
      ),
      backgroundColor: colorScheme.surfaceContainerHighest,
    ),
    appBarTheme: AppBarTheme(
      titleTextStyle: TextStyle(
        color: colorScheme.primary,
        fontFamily: _getFontFamilyFromLocale(locale),
        fontWeight: FontWeight.bold,
        fontSize: 18,
      ),
      backgroundColor:
          isDark ? colorScheme.surfaceContainer : colorScheme.surface,
      foregroundColor: colorScheme.primary,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
    ),
    textTheme: const TextTheme(
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
      titleSmall: TextStyle(
        fontSize: 16.0,
        fontWeight: FontWeight.bold,
      ),
      titleMedium: TextStyle(
        fontSize: 18.0,
        fontWeight: FontWeight.bold,
      ),
      titleLarge: TextStyle(
        fontSize: 26.0,
        fontWeight: FontWeight.bold,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: colorScheme.primary,
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
          color: colorScheme.primary,
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
        color: colorScheme.primary,
      ),
      hintStyle: const TextStyle(
        fontSize: 14.0,
        fontWeight: FontWeight.normal,
      ),
    ),
    textSelectionTheme: TextSelectionThemeData(
      cursorColor: colorScheme.primary,
    ),
    dropdownMenuTheme: DropdownMenuThemeData(
      menuStyle: const MenuStyle(
        shape: WidgetStatePropertyAll<OutlinedBorder>(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(15)),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(
            color: colorScheme.primary,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(
            color: colorScheme.outlineVariant,
          ),
          borderRadius: const BorderRadius.all(Radius.circular(15)),
        ),
        labelStyle: TextStyle(
          color: colorScheme.primary,
        ),
        hintStyle: const TextStyle(
          fontSize: 14.0,
          fontWeight: FontWeight.normal,
        ),
      ),
    ),
    dialogTheme: DialogThemeData(backgroundColor: colorScheme.surfaceContainer),
  );
}

// This method replaces all surface shades in ImmichTheme to a static ones
// as we are creating the colorscheme through seedColor the default surfaces are
// tinted with primary color
ImmichTheme decolorizeSurfaces({
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

String? _getFontFamilyFromLocale(Locale locale) {
  if (localesNotSupportedByOverpass.contains(locale)) {
    // Let Flutter use the default font
    return null;
  }
  return 'Overpass';
}

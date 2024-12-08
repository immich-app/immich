import 'package:flutter/material.dart';
import 'package:dynamic_color/dynamic_color.dart';

import 'package:immich_mobile/theme/theme_data.dart';

abstract final class DynamicTheme {
  DynamicTheme._();

  static ImmichTheme? _theme;
  // Method to fetch dynamic system colors
  static Future<void> fetchSystemPalette() async {
    try {
      final corePalette = await DynamicColorPlugin.getCorePalette();
      if (corePalette != null) {
        final primaryColor = corePalette.toColorScheme().primary;
        debugPrint('dynamic_color: Core palette detected.');

        // Some palettes do not generate surface container colors accurately,
        // so we regenerate all colors using the primary color
        _theme = ImmichTheme(
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
    } catch (error) {
      debugPrint('dynamic_color: Failed to obtain core palette: $error');
    }
  }

  static ImmichTheme? get theme => _theme;
  static bool get isAvailable => _theme != null;
}

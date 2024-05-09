import 'package:flutter/material.dart';

enum AppTheme {
  blue(AppColors._blueLight, AppColors._blueDark),
  // Fallback color for dynamic theme for non-supported platforms
  dynamic(AppColors._blueLight, AppColors._blueDark);

  final ColorScheme lightSchema;
  final ColorScheme darkSchema;

  const AppTheme(this.lightSchema, this.darkSchema);
}

class AppColors {
  const AppColors();

  /// Blue color
  static const ColorScheme _blueLight = ColorScheme(
    brightness: Brightness.light,
    primary: Color(0xff1565c0),
    onPrimary: Color(0xffffffff),
    primaryContainer: Color(0xffd6e3ff),
    onPrimaryContainer: Color(0xff001b3d),
    secondary: Color(0xff3277d2),
    onSecondary: Color(0xfffdfbff),
    secondaryContainer: Color(0xffecf0ff),
    onSecondaryContainer: Color(0xff001b3d),
    tertiary: Color(0xff7b4d88),
    onTertiary: Color(0xfffffbff),
    tertiaryContainer: Color(0xfffad7ff),
    onTertiaryContainer: Color(0xff310540),
    error: Color(0xffba1a1a),
    onError: Color(0xfffffbff),
    errorContainer: Color(0xffffdad6),
    onErrorContainer: Color(0xff410002),
    background: Color(0xfffcfafe),
    onBackground: Color(0xff191c20),
    surface: Color(0xfffdfbff),
    onSurface: Color(0xff191c20),
    surfaceVariant: Color(0xffdfe2ef),
    onSurfaceVariant: Color(0xff424751),
    outline: Color(0xff737782),
    outlineVariant: Color(0xffc2c6d2),
    shadow: Color(0xff000000),
    scrim: Color(0xff000000),
    inverseSurface: Color(0xff2e3036),
    onInverseSurface: Color(0xfff0f0f7),
    inversePrimary: Color(0xffa9c7ff),
    surfaceTint: Color(0xff00468c),
  );

  static const ColorScheme _blueDark = ColorScheme(
    brightness: Brightness.dark,
    primary: Color(0xffa9c7ff),
    onPrimary: Color(0xff001b3d),
    primaryContainer: Color(0xff00468c),
    onPrimaryContainer: Color(0xffd6e3ff),
    secondary: Color(0xffd6e3ff),
    onSecondary: Color(0xff001b3d),
    secondaryContainer: Color(0xff003063),
    onSecondaryContainer: Color(0xffd6e3ff),
    tertiary: Color(0xffeab4f6),
    onTertiary: Color(0xff310540),
    tertiaryContainer: Color(0xff61356e),
    onTertiaryContainer: Color(0xfffad7ff),
    error: Color(0xffffb4ab),
    onError: Color(0xff410002),
    errorContainer: Color(0xff93000a),
    onErrorContainer: Color(0xffffb4ab),
    background: Color(0xff1a1d21),
    onBackground: Color(0xffe2e2e9),
    surface: Color(0xff1a1e22),
    onSurface: Color(0xffe2e2e9),
    surfaceVariant: Color(0xff424852),
    onSurfaceVariant: Color(0xffc2c6d2),
    outline: Color(0xff8c919c),
    outlineVariant: Color(0xff424751),
    shadow: Color(0xff000000),
    scrim: Color(0xff000000),
    inverseSurface: Color(0xffe1e1e9),
    onInverseSurface: Color(0xff2e3036),
    inversePrimary: Color(0xff005db7),
    surfaceTint: Color(0xffa9c7ff),
  );

  static ThemeData getThemeForColorScheme(ColorScheme color) {
    return ThemeData(
      primaryColor: color.primary,
      iconTheme: const IconThemeData(weight: 400),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

final immichThemeProvider = StateProvider<ThemeMode>((ref) {
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

ColorScheme _lightColorScheme = const ColorScheme(
  brightness: Brightness.light,
  primary: Color(0xff4755b5),
  onPrimary: Color(0xffffffff),
  primaryContainer: Color(0xffdfe0ff),
  onPrimaryContainer: Color(0xff000d60),
  secondary: Color(0xff5b5d72),
  onSecondary: Color(0xffffffff),
  secondaryContainer: Color(0xFFD6D8FF),
  onSecondaryContainer: Color(0xff181a2c),
  tertiary: Color(0xff77536c),
  onTertiary: Color(0xffffffff),
  tertiaryContainer: Color(0xffffd7f0),
  onTertiaryContainer: Color(0xff2d1127),
  error: Color(0xffba1a1a),
  onError: Color(0xffffffff),
  errorContainer: Color(0xffffdad6),
  onErrorContainer: Color(0xff410002),
  background: Color(0xfff9f6fc),
  onBackground: Color(0xff1b1b1f),
  surface: Color(0xfff9f6fc),
  onSurface: Color(0xff1b1b1f),
  surfaceVariant: Color(0xffdeddea),
  onSurfaceVariant: Color(0xff46464f),
  outline: Color(0xff777680),
  outlineVariant: Color(0xffc7c5d0),
  shadow: Color(0xff000000),
  scrim: Color(0xff000000),
  inverseSurface: Color(0xff303137),
  onInverseSurface: Color(0xfff3f0f4),
  inversePrimary: Color(0xffbcc3ff),
  surfaceTint: Color(0xff4755b5),
);

ColorScheme _darkColorScheme = const ColorScheme(
  brightness: Brightness.dark,
  primary: Color(0xffa4c8ff),
  onPrimary: Color(0xff00315e),
  primaryContainer: Color(0xFF182C40),
  onPrimaryContainer: Color(0xffd4e3ff),
  secondary: Color(0xffbcc7dc),
  onSecondary: Color(0xff37474f),
  secondaryContainer: Color(0xff3d4758),
  onSecondaryContainer: Color(0xffd8e3f8),
  tertiary: Color(0xffdabde2),
  onTertiary: Color(0xff3d2946),
  tertiaryContainer: Color(0xff543f5e),
  onTertiaryContainer: Color(0xfff6d9ff),
  error: Color(0xffffb4ab),
  onError: Color(0xff690005),
  errorContainer: Color(0xff93000a),
  onErrorContainer: Color(0xffffb4ab),
  background: Color(0xff101214),
  onBackground: Color(0xffe2e2e5),
  surface: Color(0xff101214),
  onSurface: Color(0xffe2e2e5),
  surfaceVariant: Color(0xff363c42),
  onSurfaceVariant: Color(0xffc1c7ce),
  outline: Color(0xff8b9198),
  outlineVariant: Color(0xff41474d),
  shadow: Color(0xff000000),
  scrim: Color(0xff000000),
  inverseSurface: Color(0xffeeeef1),
  onInverseSurface: Color(0xff2e3133),
  inversePrimary: Color(0xff1c5fa5),
  surfaceTint: Color(0xff90caf9),
);

ThemeData getThemeForScheme(ColorScheme scheme) {
  return ThemeData(
    useMaterial3: true,
    brightness: scheme.brightness,
    colorScheme: scheme,
    primaryColor: scheme.primary,
    scaffoldBackgroundColor: scheme.background,
    fontFamily: 'Overpass',
    appBarTheme: AppBarTheme(
      iconTheme: IconThemeData(color: scheme.primary),
      titleTextStyle: TextStyle(
        fontSize: 18.0,
        fontWeight: FontWeight.bold,
        color: scheme.primary,
      ),
      centerTitle: true,
    ),
    snackBarTheme: const SnackBarThemeData(
      contentTextStyle: TextStyle(
        fontFamily: 'Overpass',
        fontWeight: FontWeight.bold,
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      type: BottomNavigationBarType.fixed,
    ),
    cardTheme: const CardTheme(elevation: 2.0),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        visualDensity: VisualDensity.standard,
        textStyle: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 11,
        ),
        shadowColor: scheme.shadow,
        foregroundColor: scheme.onPrimary,
        backgroundColor: scheme.primary,
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      iconTheme: MaterialStateProperty.resolveWith<IconThemeData?>((states) {
        if (states.contains(MaterialState.selected)) {
          return IconThemeData(color: scheme.primary);
        }
        return null;
      }),
      labelTextStyle: const MaterialStatePropertyAll(
        TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
      ),
    ),
    textTheme: TextTheme(
      displayLarge: TextStyle(
        fontSize: 26,
        fontWeight: FontWeight.bold,
        color: scheme.primary,
      ),
      displayMedium: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.bold,
      ),
      displaySmall: const TextStyle(
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
      titleLarge: TextStyle(
        fontSize: 26.0,
        fontWeight: FontWeight.bold,
        color: scheme.primary,
      ),
    ),
    chipTheme: const ChipThemeData(
      side: BorderSide.none,
    ),
    sliderTheme: const SliderThemeData(
      thumbShape: RoundSliderThumbShape(enabledThumbRadius: 7),
      trackHeight: 2.0,
    ),
    inputDecorationTheme: InputDecorationTheme(
      labelStyle: TextStyle(
        color: scheme.primary,
      ),
      hintStyle: const TextStyle(
        fontSize: 14.0,
        fontWeight: FontWeight.normal,
      ),
    ),
  );
}

final ThemeData immichLightTheme = getThemeForScheme(_lightColorScheme);
final ThemeData immichDarkTheme = getThemeForScheme(_darkColorScheme);

const redAccent = Colors.redAccent;
const orangeAccent = Colors.orangeAccent;

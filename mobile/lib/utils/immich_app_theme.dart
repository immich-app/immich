import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/immich_colors.dart';
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

ThemeData immichDarkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  primarySwatch: Colors.indigo,
  primaryColor: immichDarkThemePrimaryColor,
  scaffoldBackgroundColor: immichDarkBackgroundColor,
  hintColor: Colors.grey[600],
  fontFamily: 'WorkSans',
  snackBarTheme: const SnackBarThemeData(
    contentTextStyle: TextStyle(fontFamily: 'WorkSans'),
  ),
  appBarTheme: AppBarTheme(
    titleTextStyle: TextStyle(
      fontFamily: 'WorkSans',
      color: immichDarkThemePrimaryColor,
    ),
    backgroundColor: const Color.fromARGB(255, 32, 33, 35),
    foregroundColor: immichDarkThemePrimaryColor,
    elevation: 1,
    centerTitle: true,
  ),
  bottomNavigationBarTheme: BottomNavigationBarThemeData(
    type: BottomNavigationBarType.fixed,
    backgroundColor: const Color.fromARGB(255, 35, 36, 37),
    selectedItemColor: immichDarkThemePrimaryColor,
  ),
  drawerTheme: DrawerThemeData(
    backgroundColor: immichDarkBackgroundColor,
    scrimColor: Colors.white.withOpacity(0.1),
  ),
  textTheme: TextTheme(
    headline1: const TextStyle(
      fontSize: 26,
      fontWeight: FontWeight.bold,
      color: Color.fromARGB(255, 255, 255, 255),
    ),
    headline2: const TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.bold,
      color: Color.fromARGB(255, 148, 151, 155),
    ),
    headline3: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.bold,
      color: immichDarkThemePrimaryColor,
    ),
  ),
  cardColor: Colors.grey[900],
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      foregroundColor: Colors.black87,
      backgroundColor: immichDarkThemePrimaryColor,
    ),
  ),
);

ThemeData immichLightTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  primarySwatch: Colors.indigo,
  hintColor: Colors.indigo,
  fontFamily: 'WorkSans',
  scaffoldBackgroundColor: immichBackgroundColor,
  snackBarTheme: const SnackBarThemeData(
    contentTextStyle: TextStyle(fontFamily: 'WorkSans'),
  ),
  appBarTheme: AppBarTheme(
    titleTextStyle: const TextStyle(
      fontFamily: 'WorkSans',
      color: Colors.indigo,
    ),
    backgroundColor: immichBackgroundColor,
    foregroundColor: Colors.indigo,
    elevation: 1,
    centerTitle: true,
  ),
  bottomNavigationBarTheme: BottomNavigationBarThemeData(
    type: BottomNavigationBarType.fixed,
    backgroundColor: immichBackgroundColor,
    selectedItemColor: Colors.indigo,
  ),
  drawerTheme: DrawerThemeData(
    backgroundColor: immichBackgroundColor,
  ),
  textTheme: const TextTheme(
    headline1: TextStyle(
      fontSize: 26,
      fontWeight: FontWeight.bold,
      color: Colors.indigo,
    ),
    headline2: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.bold,
      color: Colors.black87,
    ),
    headline3: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.bold,
      color: Colors.indigo,
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: Colors.indigo,
      foregroundColor: Colors.white,
    ),
  ),
);

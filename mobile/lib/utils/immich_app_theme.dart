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

ThemeData base = ThemeData(
  chipTheme: const ChipThemeData(
    side: BorderSide.none,
  ),
);

ThemeData immichLightTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  primarySwatch: Colors.indigo,
  primaryColor: Colors.indigo,
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
    elevation: 0,
    scrolledUnderElevation: 0,
    centerTitle: true,
  ),
  bottomNavigationBarTheme: BottomNavigationBarThemeData(
    type: BottomNavigationBarType.fixed,
    backgroundColor: immichBackgroundColor,
    selectedItemColor: Colors.indigo,
  ),
  cardTheme: const CardTheme(
    surfaceTintColor: Colors.transparent,
  ),
  drawerTheme: DrawerThemeData(
    backgroundColor: immichBackgroundColor,
  ),
  textTheme: const TextTheme(
    displayLarge: TextStyle(
      fontSize: 26,
      fontWeight: FontWeight.bold,
      color: Colors.indigo,
    ),
    displayMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.bold,
      color: Colors.black87,
    ),
    displaySmall: TextStyle(
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
  chipTheme: base.chipTheme,
  popupMenuTheme: const PopupMenuThemeData(
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.all(Radius.circular(10)),
    ),
    surfaceTintColor: Colors.transparent,
    color: Colors.white,
  ),
  navigationBarTheme: NavigationBarThemeData(
    indicatorColor: Colors.indigo.withOpacity(0.15),
    backgroundColor: immichBackgroundColor,
    surfaceTintColor: Colors.transparent,
  ),
);

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
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: immichDarkThemePrimaryColor,
    ),
  ),
  appBarTheme: AppBarTheme(
    titleTextStyle: TextStyle(
      fontFamily: 'WorkSans',
      color: immichDarkThemePrimaryColor,
    ),
    backgroundColor: const Color.fromARGB(255, 32, 33, 35),
    foregroundColor: immichDarkThemePrimaryColor,
    elevation: 0,
    scrolledUnderElevation: 0,
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
    displayLarge: const TextStyle(
      fontSize: 26,
      fontWeight: FontWeight.bold,
      color: Color.fromARGB(255, 255, 255, 255),
    ),
    displayMedium: const TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.bold,
      color: Color.fromARGB(255, 255, 255, 255),
    ),
    displaySmall: TextStyle(
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
  chipTheme: base.chipTheme,
  popupMenuTheme: const PopupMenuThemeData(
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.all(Radius.circular(10)),
    ),
    surfaceTintColor: Colors.transparent,
  ),
  navigationBarTheme: NavigationBarThemeData(
    indicatorColor: immichDarkThemePrimaryColor.withOpacity(0.4),
    iconTheme: const MaterialStatePropertyAll(
      IconThemeData(color: Colors.white),
    ),
    backgroundColor: Colors.grey[900],
    surfaceTintColor: Colors.transparent,
  ),
);

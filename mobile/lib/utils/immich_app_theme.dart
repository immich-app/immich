import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/immich_colors.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

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

final ThemeData base = ThemeData(
  chipTheme: const ChipThemeData(
    side: BorderSide.none,
  ),
  sliderTheme: const SliderThemeData(
    thumbShape: RoundSliderThumbShape(enabledThumbRadius: 7),
    trackHeight: 2.0,
  ),
);

final ThemeData immichLightTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  colorScheme: ColorScheme.fromSeed(
    seedColor: Colors.indigo,
  ),
  primarySwatch: Colors.indigo,
  primaryColor: Colors.indigo,
  hintColor: Colors.indigo,
  focusColor: Colors.indigo,
  splashColor: Colors.indigo.withOpacity(0.15),
  fontFamily: 'Overpass',
  scaffoldBackgroundColor: immichBackgroundColor,
  snackBarTheme: const SnackBarThemeData(
    contentTextStyle: TextStyle(
      fontFamily: 'Overpass',
      color: Colors.indigo,
      fontWeight: FontWeight.bold,
    ),
    backgroundColor: Colors.white,
  ),
  appBarTheme: const AppBarTheme(
    titleTextStyle: TextStyle(
      fontFamily: 'Overpass',
      color: Colors.indigo,
      fontWeight: FontWeight.bold,
      fontSize: 18,
    ),
    backgroundColor: immichBackgroundColor,
    foregroundColor: Colors.indigo,
    elevation: 0,
    scrolledUnderElevation: 0,
    centerTitle: true,
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    type: BottomNavigationBarType.fixed,
    backgroundColor: immichBackgroundColor,
    selectedItemColor: Colors.indigo,
  ),
  cardTheme: const CardTheme(
    surfaceTintColor: Colors.transparent,
  ),
  drawerTheme: const DrawerThemeData(
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
      backgroundColor: Colors.indigo,
      foregroundColor: Colors.white,
    ),
  ),
  chipTheme: base.chipTheme,
  sliderTheme: base.sliderTheme,
  popupMenuTheme: const PopupMenuThemeData(
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.all(Radius.circular(10)),
    ),
    surfaceTintColor: Colors.transparent,
    color: Colors.white,
  ),
  navigationBarTheme: NavigationBarThemeData(
    indicatorColor: Colors.indigo.withOpacity(0.15),
    iconTheme: WidgetStatePropertyAll(
      IconThemeData(color: Colors.grey[700]),
    ),
    backgroundColor: immichBackgroundColor,
    surfaceTintColor: Colors.transparent,
    labelTextStyle: WidgetStatePropertyAll(
      TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: Colors.grey[800],
      ),
    ),
  ),
  dialogTheme: const DialogTheme(
    surfaceTintColor: Colors.transparent,
  ),
  inputDecorationTheme: const InputDecorationTheme(
    focusedBorder: OutlineInputBorder(
      borderSide: BorderSide(
        color: Colors.indigo,
      ),
    ),
    labelStyle: TextStyle(
      color: Colors.indigo,
    ),
    hintStyle: TextStyle(
      fontSize: 14.0,
      fontWeight: FontWeight.normal,
    ),
  ),
  textSelectionTheme: const TextSelectionThemeData(
    cursorColor: Colors.indigo,
  ),
);

final ThemeData immichDarkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  primarySwatch: Colors.indigo,
  primaryColor: immichDarkThemePrimaryColor,
  colorScheme: ColorScheme.fromSeed(
    seedColor: immichDarkThemePrimaryColor,
    brightness: Brightness.dark,
  ),
  scaffoldBackgroundColor: immichDarkBackgroundColor,
  hintColor: Colors.grey[600],
  fontFamily: 'Overpass',
  snackBarTheme: SnackBarThemeData(
    contentTextStyle: const TextStyle(
      fontFamily: 'Overpass',
      color: immichDarkThemePrimaryColor,
      fontWeight: FontWeight.bold,
    ),
    backgroundColor: Colors.grey[900],
  ),
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: immichDarkThemePrimaryColor,
    ),
  ),
  appBarTheme: const AppBarTheme(
    titleTextStyle: TextStyle(
      fontFamily: 'Overpass',
      color: immichDarkThemePrimaryColor,
      fontWeight: FontWeight.bold,
      fontSize: 18,
    ),
    backgroundColor: Color.fromARGB(255, 32, 33, 35),
    foregroundColor: immichDarkThemePrimaryColor,
    elevation: 0,
    scrolledUnderElevation: 0,
    centerTitle: true,
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    type: BottomNavigationBarType.fixed,
    backgroundColor: Color.fromARGB(255, 35, 36, 37),
    selectedItemColor: immichDarkThemePrimaryColor,
  ),
  drawerTheme: DrawerThemeData(
    backgroundColor: immichDarkBackgroundColor,
    scrimColor: Colors.white.withOpacity(0.1),
  ),
  textTheme: const TextTheme(
    displayLarge: TextStyle(
      fontSize: 26,
      fontWeight: FontWeight.bold,
      color: Color.fromARGB(255, 255, 255, 255),
    ),
    displayMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.bold,
      color: Color.fromARGB(255, 255, 255, 255),
    ),
    displaySmall: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.bold,
      color: immichDarkThemePrimaryColor,
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
  cardColor: Colors.grey[900],
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      foregroundColor: Colors.black87,
      backgroundColor: immichDarkThemePrimaryColor,
    ),
  ),
  chipTheme: base.chipTheme,
  sliderTheme: base.sliderTheme,
  popupMenuTheme: const PopupMenuThemeData(
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.all(Radius.circular(10)),
    ),
    surfaceTintColor: Colors.transparent,
  ),
  navigationBarTheme: NavigationBarThemeData(
    indicatorColor: immichDarkThemePrimaryColor.withOpacity(0.4),
    iconTheme: WidgetStatePropertyAll(
      IconThemeData(color: Colors.grey[500]),
    ),
    backgroundColor: Colors.grey[900],
    surfaceTintColor: Colors.transparent,
    labelTextStyle: WidgetStatePropertyAll(
      TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: Colors.grey[300],
      ),
    ),
  ),
  dialogTheme: const DialogTheme(
    surfaceTintColor: Colors.transparent,
  ),
  inputDecorationTheme: const InputDecorationTheme(
    focusedBorder: OutlineInputBorder(
      borderSide: BorderSide(
        color: immichDarkThemePrimaryColor,
      ),
    ),
    labelStyle: TextStyle(
      color: immichDarkThemePrimaryColor,
    ),
    hintStyle: TextStyle(
      fontSize: 14.0,
      fontWeight: FontWeight.normal,
    ),
  ),
  textSelectionTheme: const TextSelectionThemeData(
    cursorColor: immichDarkThemePrimaryColor,
  ),
);

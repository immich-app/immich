import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/constants/immich_colors.dart';

Color darkThemePrimaryColor = const Color.fromARGB(255, 178, 190, 245);

ThemeMode immichThemeMode = ThemeMode.dark;

ThemeData immichDarkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  primarySwatch: Colors.indigo,
  fontFamily: 'WorkSans',
  snackBarTheme: const SnackBarThemeData(
    contentTextStyle: TextStyle(fontFamily: 'WorkSans'),
  ),
  scaffoldBackgroundColor: immichDarkBackgroundColor,
  appBarTheme: AppBarTheme(
    titleTextStyle: TextStyle(
      color: darkThemePrimaryColor,
    ),
    backgroundColor: Colors.grey[900],
    foregroundColor: darkThemePrimaryColor,
    elevation: 1,
    centerTitle: true,
    systemOverlayStyle: SystemUiOverlayStyle.light,
  ),
  bottomNavigationBarTheme: BottomNavigationBarThemeData(
    type: BottomNavigationBarType.fixed,
    backgroundColor: immichDarkBackgroundColor,
    selectedItemColor: darkThemePrimaryColor,
  ),
  textTheme: TextTheme(
    headline1: TextStyle(
      fontSize: 26,
      fontWeight: FontWeight.bold,
      color: Colors.grey[300],
    ),
    headline2: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.bold,
      color: Colors.grey[300],
    ),
  ),
);

ThemeData immichLightTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  primarySwatch: Colors.indigo,
  fontFamily: 'WorkSans',
  snackBarTheme: const SnackBarThemeData(
    contentTextStyle: TextStyle(fontFamily: 'WorkSans'),
  ),
  scaffoldBackgroundColor: immichBackgroundColor,
  appBarTheme: const AppBarTheme(
    titleTextStyle: TextStyle(
      color: Colors.indigo,
    ),
    backgroundColor: immichBackgroundColor,
    foregroundColor: Colors.indigo,
    elevation: 1,
    centerTitle: true,
    systemOverlayStyle: SystemUiOverlayStyle.dark,
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    type: BottomNavigationBarType.fixed,
    backgroundColor: immichBackgroundColor,
    selectedItemColor: Colors.indigo,
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
  ),
);

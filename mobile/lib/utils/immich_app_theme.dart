import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/constants/immich_colors.dart';

Color darkThemePrimaryColor = const Color.fromARGB(255, 173, 203, 250);

ThemeMode immichThemeMode = ThemeMode.dark;

ThemeData immichDarkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  primarySwatch: Colors.indigo,
  primaryColor: darkThemePrimaryColor,
  fontFamily: 'WorkSans',
  snackBarTheme: const SnackBarThemeData(
    contentTextStyle: TextStyle(fontFamily: 'WorkSans'),
  ),
  scaffoldBackgroundColor: immichDarkBackgroundColor,
  appBarTheme: AppBarTheme(
    titleTextStyle: TextStyle(
      fontFamily: 'WorkSans',
      color: darkThemePrimaryColor,
    ),
    backgroundColor: const Color.fromARGB(255, 32, 33, 35),
    foregroundColor: const Color.fromARGB(255, 189, 193, 197),
    elevation: 1,
    centerTitle: true,
    systemOverlayStyle: SystemUiOverlayStyle.light,
  ),
  bottomNavigationBarTheme: BottomNavigationBarThemeData(
    type: BottomNavigationBarType.fixed,
    backgroundColor: const Color.fromARGB(255, 35, 36, 37),
    selectedItemColor: darkThemePrimaryColor,
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
      color: darkThemePrimaryColor,
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
      fontFamily: 'WorkSans',
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
    headline3: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.bold,
      color: Colors.indigo,
    ),
  ),
);

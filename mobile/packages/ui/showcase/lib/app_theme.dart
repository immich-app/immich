import 'package:flutter/material.dart';

class AppTheme {
  // Light theme colors
  static const _primary500 = Color(0xFF4250AF);
  static const _primary100 = Color(0xFFD4D6F0);
  static const _primary900 = Color(0xFF181E44);
  static const _danger500 = Color(0xFFE53E3E);
  static const _light50 = Color(0xFFFAFAFA);
  static const _light300 = Color(0xFFD4D4D4);
  static const _light500 = Color(0xFF737373);

  // Dark theme colors
  static const _darkPrimary500 = Color(0xFFACCBFA);
  static const _darkPrimary300 = Color(0xFF616D94);
  static const _darkDanger500 = Color(0xFFE88080);
  static const _darkLight50 = Color(0xFF0A0A0A);
  static const _darkLight100 = Color(0xFF171717);
  static const _darkLight200 = Color(0xFF262626);

  static ThemeData get lightTheme {
    return ThemeData(
      colorScheme: const ColorScheme.light(
        primary: _primary500,
        onPrimary: Colors.white,
        primaryContainer: _primary100,
        onPrimaryContainer: _primary900,
        secondary: _light500,
        onSecondary: Colors.white,
        error: _danger500,
        onError: Colors.white,
        surface: _light50,
        onSurface: Color(0xFF1A1C1E),
        surfaceContainerHighest: Color(0xFFE3E4E8),
        outline: Color(0xFFD1D3D9),
        outlineVariant: _light300,
      ),
      useMaterial3: true,
      scaffoldBackgroundColor: _light50,
      cardTheme: const CardThemeData(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          side: BorderSide(color: _light300, width: 1),
        ),
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        foregroundColor: Color(0xFF1A1C1E),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      colorScheme: const ColorScheme.dark(
        primary: _darkPrimary500,
        onPrimary: Color(0xFF0F1433),
        primaryContainer: _darkPrimary300,
        onPrimaryContainer: _primary100,
        secondary: Color(0xFFC4C6D0),
        onSecondary: Color(0xFF2E3042),
        error: _darkDanger500,
        onError: Color(0xFF0F1433),
        surface: _darkLight50,
        onSurface: Color(0xFFE3E3E6),
        surfaceContainerHighest: _darkLight200,
        outline: Color(0xFF8E9099),
        outlineVariant: Color(0xFF43464F),
      ),
      useMaterial3: true,
      scaffoldBackgroundColor: _darkLight50,
      cardTheme: const CardThemeData(
        elevation: 0,
        color: _darkLight100,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          side: BorderSide(color: _darkLight200, width: 1),
        ),
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: _darkLight50,
        surfaceTintColor: Colors.transparent,
        foregroundColor: Color(0xFFE3E3E6),
      ),
    );
  }
}

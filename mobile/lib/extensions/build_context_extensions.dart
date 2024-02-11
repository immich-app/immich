import 'package:flutter/material.dart';

extension ContextHelper on BuildContext {
  // Returns the current padding from MediaQuery
  EdgeInsets get padding => MediaQuery.paddingOf(this);

  // Returns the current width from MediaQuery
  double get width => MediaQuery.sizeOf(this).width;

  // Returns the current height from MediaQuery
  double get height => MediaQuery.sizeOf(this).height;

  // Returns true if the app is running on a mobile device (!tablets)
  bool get isMobile => width < 550;

  // Returns the current ThemeData
  ThemeData get themeData => Theme.of(this);

  // Returns true if the app is using a dark theme
  bool get isDarkTheme => themeData.brightness == Brightness.dark;

  // Returns the current Primary color of the Theme
  Color get primaryColor => themeData.primaryColor;

  // Returns the Scaffold background color of the Theme
  Color get scaffoldBackgroundColor => themeData.scaffoldBackgroundColor;

  // Returns the current TextTheme
  TextTheme get textTheme => themeData.textTheme;

  // Current ColorScheme used
  ColorScheme get colorScheme => themeData.colorScheme;

  // Pop-out from the current context with optional result
  void pop<T>([T? result]) => Navigator.of(this).pop(result);
}

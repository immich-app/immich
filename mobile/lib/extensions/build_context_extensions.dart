import 'package:flutter/material.dart';

extension ContextHelper on BuildContext {
  // Returns the current padding from MediaQuery
  EdgeInsets get padding => MediaQuery.paddingOf(this);

  // Returns the current view insets from MediaQuery
  EdgeInsets get viewInsets => MediaQuery.viewInsetsOf(this);

  // Returns the current width from MediaQuery
  double get width => MediaQuery.sizeOf(this).width;

  // Returns the current height from MediaQuery
  double get height => MediaQuery.sizeOf(this).height;

  // Returns true if the app is running on a mobile device (!tablets)
  bool get isMobile => width < 550;

  // Returns the current device pixel ratio from MediaQuery
  double get devicePixelRatio => MediaQuery.devicePixelRatioOf(this);

  // Returns the current orientation from MediaQuery
  Orientation get orientation => MediaQuery.orientationOf(this);

  // Returns the current platform brightness from MediaQuery
  Brightness get platformBrightness => MediaQuery.platformBrightnessOf(this);

  // Returns the current ThemeData
  ThemeData get themeData => Theme.of(this);

  // Returns true if the app is using a dark theme
  bool get isDarkTheme => themeData.brightness == Brightness.dark;

  // Returns the current Primary color of the Theme
  Color get primaryColor => themeData.colorScheme.primary;

  // Returns the Scaffold background color of the Theme
  Color get scaffoldBackgroundColor => colorScheme.surface;

  // Returns the current TextTheme
  TextTheme get textTheme => themeData.textTheme;

  // Current ColorScheme used
  ColorScheme get colorScheme => themeData.colorScheme;

  // Navigate by pushing or popping routes from the current context
  NavigatorState get navigator => Navigator.of(this);

  // Showing material banners from the current context
  ScaffoldMessengerState get scaffoldMessenger => ScaffoldMessenger.of(this);

  // Pop-out from the current context with optional result
  void pop<T>([T? result]) => Navigator.of(this).pop(result);

  // Managing focus within the widget tree from the current context
  FocusScopeNode get focusScope => FocusScope.of(this);

  // Show SnackBars from the current context
  void showSnackBar(SnackBar snackBar) =>
      ScaffoldMessenger.of(this).showSnackBar(snackBar);
}

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

extension ContextHelper on BuildContext {
  // Returns the current size from MediaQuery
  Size get size => MediaQuery.sizeOf(this);

  // Returns the current width from MediaQuery
  double get width => size.width;

  // Returns the current height from MediaQuery
  double get height => size.height;

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

  // Auto-Push new route from the current context
  Future<T?> autoPush<T extends Object?>(PageRouteInfo<dynamic> route) =>
      AutoRouter.of(this).push(route);

  // Auto-Push navigate route from the current context
  Future<dynamic> autoNavigate<T extends Object?>(
    PageRouteInfo<dynamic> route,
  ) =>
      AutoRouter.of(this).navigate(route);

  // Auto-Push replace route from the current context
  Future<T?> autoReplace<T extends Object?>(PageRouteInfo<dynamic> route) =>
      AutoRouter.of(this).replace(route);

  // Auto-Pop from the current context
  Future<bool> autoPop<T>([T? result]) => AutoRouter.of(this).pop(result);
}

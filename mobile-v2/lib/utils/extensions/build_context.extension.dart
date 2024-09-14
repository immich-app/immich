import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

extension BuildContextHelper on BuildContext {
  /// Get the current [ThemeData] used
  ThemeData get theme => Theme.of(this);

  /// Get the current [ColorScheme] used
  ColorScheme get colorScheme => theme.colorScheme;

  /// Get the current [TextTheme] used
  TextTheme get textTheme => theme.textTheme;

  /// Get the default [TextStyle]
  TextStyle get defaultTextStyle => DefaultTextStyle.of(this).style;

  /// Get the [Size] of [MediaQuery]
  Size get mediaQuerySize => MediaQuery.sizeOf(this);

  /// Get the [EdgeInsets] of [MediaQuery]
  EdgeInsets get viewInsets => MediaQuery.viewInsetsOf(this);

  // Returns the current width from MediaQuery
  double get width => mediaQuerySize.width;

  // Returns the current height from MediaQuery
  double get height => mediaQuerySize.height;

  /// True if the current device is a Tablet
  bool get isTablet => (mediaQuerySize.width >= 600);

  /// True if the current app theme is dark
  bool get isDarkTheme => theme.brightness == Brightness.dark;

  /// Navigate using the root router
  // ignore: avoid-dynamic
  Future<dynamic> navigateRoot(
    PageRouteInfo route, {
    OnNavigationFailure? onFailure,
  }) =>
      router.root.navigate(route, onFailure: onFailure);
}

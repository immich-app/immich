import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

extension BuildContextHelper on BuildContext {
  /// Get the current [ThemeData] used
  ThemeData get theme => Theme.of(this);

  /// Get the default [TextStyle]
  TextStyle get defaultTextStyle => DefaultTextStyle.of(this).style;

  /// Get the [Size] of [MediaQuery]
  Size get mediaQuerySize => MediaQuery.sizeOf(this);

  /// Get the [EdgeInsets] of [MediaQuery]
  EdgeInsets get viewInsets => MediaQuery.viewInsetsOf(this);

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

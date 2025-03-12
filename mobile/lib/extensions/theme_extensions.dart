import 'package:flutter/material.dart';

extension ImmichColorSchemeExtensions on ColorScheme {
  bool get _isDarkMode => brightness == Brightness.dark;
  Color get onSurfaceSecondary => _isDarkMode
      ? onSurface.darken(amount: .3)
      : onSurface.lighten(amount: .3);
}

extension ColorExtensions on Color {
  Color lighten({double amount = 0.1}) {
    return Color.alphaBlend(
      Colors.white.withValues(alpha: amount),
      this,
    );
  }

  Color darken({double amount = 0.1}) {
    return Color.alphaBlend(
      Colors.black.withValues(alpha: amount),
      this,
    );
  }
}

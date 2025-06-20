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

extension SettingsTextStyles on BuildContext {
  TextTheme get _textTheme => Theme.of(this).textTheme;
  ColorScheme get _colors => Theme.of(this).colorScheme;
  Color get _disabled => Theme.of(this).disabledColor;

  TextStyle get sectionTitle => _textTheme.titleSmall!.copyWith(
        letterSpacing: -0.25,
        color: _colors.primary,
      );

  TextStyle get itemTitle => _textTheme.titleSmall!.copyWith(
        fontWeight: FontWeight.w500,
        letterSpacing: 0,
        color: _colors.onSurface,
      );

  TextStyle get itemTitleDisabled => itemTitle.copyWith(color: _disabled);

  TextStyle get itemSubtitle => _textTheme.bodyMedium!.copyWith(
        height: 1.4,
        letterSpacing: 0,
        color: _colors.onSurfaceSecondary,
      );

  TextStyle get itemSubtitleDisabled => itemSubtitle.copyWith(color: _disabled);

  TextStyle get caption => _textTheme.bodySmall!.copyWith(
        height: 1.4,
        letterSpacing: 0,
        color: _colors.onSurfaceSecondary,
      );

  TextStyle get pageTitle => _textTheme.titleMedium!.copyWith(
        fontWeight: FontWeight.w600,
        color: _colors.primary,
      );
}

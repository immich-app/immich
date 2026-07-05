import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/colors.dart';

class ThemeConfig {
  final ThemeMode mode;
  final ImmichColorPreset primaryColor;
  final bool dynamicTheme;
  final bool colorfulInterface;

  const ThemeConfig({
    this.mode = .system,
    this.primaryColor = .indigo,
    this.dynamicTheme = false,
    this.colorfulInterface = true,
  });

  ThemeConfig copyWith({
    ThemeMode? mode,
    ImmichColorPreset? primaryColor,
    bool? dynamicTheme,
    bool? colorfulInterface,
  }) => .new(
    mode: mode ?? this.mode,
    primaryColor: primaryColor ?? this.primaryColor,
    dynamicTheme: dynamicTheme ?? this.dynamicTheme,
    colorfulInterface: colorfulInterface ?? this.colorfulInterface,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ThemeConfig &&
          other.mode == mode &&
          other.primaryColor == primaryColor &&
          other.dynamicTheme == dynamicTheme &&
          other.colorfulInterface == colorfulInterface);

  @override
  int get hashCode => Object.hash(mode, primaryColor, dynamicTheme, colorfulInterface);

  @override
  String toString() =>
      'ThemeConfig(mode: $mode, primaryColor: $primaryColor, dynamicTheme: $dynamicTheme, colorfulInterface: $colorfulInterface)';
}

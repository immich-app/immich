import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/colors.dart';

class ThemeConfig {
  final ThemeMode mode;
  final ImmichColorPreset primaryColor;
  final bool dynamicTheme;

  const ThemeConfig({this.mode = .system, this.primaryColor = .indigo, this.dynamicTheme = false});

  ThemeConfig copyWith({ThemeMode? mode, ImmichColorPreset? primaryColor, bool? dynamicTheme}) => .new(
    mode: mode ?? this.mode,
    primaryColor: primaryColor ?? this.primaryColor,
    dynamicTheme: dynamicTheme ?? this.dynamicTheme,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ThemeConfig &&
          other.mode == mode &&
          other.primaryColor == primaryColor &&
          other.dynamicTheme == dynamicTheme);

  @override
  int get hashCode => Object.hash(mode, primaryColor, dynamicTheme);

  @override
  String toString() => 'ThemeConfig(mode: $mode, primaryColor: $primaryColor, dynamicTheme: $dynamicTheme)';
}

import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/colors.dart';

class ThemeConfig {
  final ThemeMode mode;
  final ImmichColorPreset primaryColor;

  const ThemeConfig({this.mode = .system, this.primaryColor = .indigo});

  ThemeConfig copyWith({ThemeMode? mode, ImmichColorPreset? primaryColor}) =>
      .new(mode: mode ?? this.mode, primaryColor: primaryColor ?? this.primaryColor);

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is ThemeConfig && other.mode == mode && other.primaryColor == primaryColor);

  @override
  int get hashCode => Object.hash(mode, primaryColor);

  @override
  String toString() => 'ThemeConfig(mode: $mode, primaryColor: $primaryColor)';
}

import 'package:flutter/material.dart';

class ThemeConfig {
  final ThemeMode mode;

  const ThemeConfig({this.mode = .system});

  ThemeConfig copyWith({ThemeMode? mode}) => .new(mode: mode ?? this.mode);

  @override
  bool operator ==(Object other) => identical(this, other) || (other is ThemeConfig && other.mode == mode);

  @override
  int get hashCode => mode.hashCode;

  @override
  String toString() => 'ThemeConfig(mode: $mode)';
}

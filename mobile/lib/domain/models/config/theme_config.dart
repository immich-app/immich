import 'package:flutter/material.dart';

class _Keys {
  const _Keys();

  final mode = 'mode';
}

class ThemeConfig {
  static const String name = 'theme';
  // ignore: library_private_types_in_public_api
  static const _Keys keys = _Keys();

  final ThemeMode mode;

  const ThemeConfig({this.mode = ThemeMode.system});

  @override
  bool operator ==(Object other) => identical(this, other) || (other is ThemeConfig && other.mode == mode);

  @override
  int get hashCode => mode.hashCode;

  @override
  String toString() => '$name: {${keys.mode}: $mode}';
}

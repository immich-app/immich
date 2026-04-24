import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/config/theme_config.dart';
import 'package:immich_mobile/domain/models/metadata_value.dart';
import 'package:immich_mobile/extensions/json_extensions.dart';

class AppConfig implements MetadataValue {
  static const String name = 'app-config';

  final ThemeConfig theme;

  const AppConfig({this.theme = const ThemeConfig()});

  factory AppConfig.fromJson(Map<String, Object?> json) {
    final themeJson = json.nested(ThemeConfig.name);
    return AppConfig(
      theme: ThemeConfig(
        mode: ThemeMode.values.firstWhere(
          (e) => e.name == themeJson[ThemeConfig.keys.mode],
          orElse: () => ThemeMode.system,
        ),
      ),
    );
  }

  @override
  Map<String, Object?> toJson() => {
    ThemeConfig.name: {ThemeConfig.keys.mode: theme.mode.name},
  };

  AppConfig copyWith({ThemeMode? themeMode}) => AppConfig(theme: ThemeConfig(mode: themeMode ?? theme.mode));

  @override
  bool operator ==(Object other) => identical(this, other) || (other is AppConfig && other.theme == theme);

  @override
  int get hashCode => theme.hashCode;

  @override
  String toString() => '$name: { $theme }';
}

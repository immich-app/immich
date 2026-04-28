import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/log.model.dart';

enum MetadataDomain {
  appConfig('app-config'),
  systemConfig('system-config');

  final String prefix;
  const MetadataDomain(this.prefix);
}

enum MetadataKey<T extends Object> {
  themeMode<ThemeMode>(.appConfig, 'theme.mode', .system, ThemeMode.values),
  logLevel<LogLevel>(.systemConfig, 'log.level', .info, LogLevel.values);

  final MetadataDomain domain;
  final String name;
  final T defaultValue;
  final List<T>? enumValues;

  const MetadataKey(this.domain, this.name, this.defaultValue, [this.enumValues]);

  String get key => '${domain.prefix}.$name';

  static MetadataKey<Object>? fromKey(String key) {
    for (final m in MetadataKey.values) {
      if (m.key == key) return m;
    }
    return null;
  }
}

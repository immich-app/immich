import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/system_config.dart';
import 'package:immich_mobile/domain/models/log.model.dart';

enum MetadataDomain<T extends Object> {
  appConfig<AppConfig>('config.app'),
  systemConfig<SystemConfig>('config.system');

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

  static Map<String, MetadataKey<Object>> asKeyMap() => {for (var value in MetadataKey.values) value.key: value};
}

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/colors.dart';
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
  // Theme
  primaryColor<ImmichColorPreset>(.appConfig, 'theme.primaryColor', .indigo, _EnumCodec(ImmichColorPreset.values)),
  themeMode<ThemeMode>(.appConfig, 'theme.mode', .system, _EnumCodec(ThemeMode.values)),
  dynamicTheme<bool>(.appConfig, 'theme.dynamicTheme', false),
  colorfulInterface<bool>(.appConfig, 'theme.colorfulInterface', true),

  // Log
  logLevel<LogLevel>(.systemConfig, 'log.level', .info, _EnumCodec(LogLevel.values));

  final MetadataDomain domain;
  final String name;
  final T defaultValue;
  final _MetadataCodec<T>? _codecOverride;

  const MetadataKey(this.domain, this.name, this.defaultValue, [this._codecOverride]);

  String get key => '${domain.prefix}.$name';

  _MetadataCodec<T> get _codec => _codecOverride ?? _MetadataCodec.forPrimitive(defaultValue);

  String encode(T value) => _codec.encode(value);

  T decode(String raw) => _codec.decode(raw) ?? defaultValue;

  static Map<String, MetadataKey<Object>> asKeyMap() => {for (var value in MetadataKey.values) value.key: value};
}

sealed class _MetadataCodec<T extends Object> {
  const _MetadataCodec();

  String encode(T value);
  T? decode(String raw);

  static const Map<Type, _MetadataCodec<Object>> _primitives = {
    int: _PrimitiveCodec.integer,
    double: _PrimitiveCodec.real,
    bool: _PrimitiveCodec.boolean,
    String: _PrimitiveCodec.string,
    DateTime: _DateTimeCodec(),
  };

  static _MetadataCodec<T> forPrimitive<T extends Object>(T sample) {
    final codec = _primitives[sample.runtimeType];
    if (codec == null) {
      throw StateError(
        'No primitive codec for ${sample.runtimeType}. Provide an explicit codec when defining the MetadataKey.',
      );
    }
    return codec as _MetadataCodec<T>;
  }
}

final class _EnumCodec<T extends Enum> extends _MetadataCodec<T> {
  final List<T> values;

  const _EnumCodec(this.values);

  @override
  String encode(T value) => value.name;

  @override
  T? decode(String raw) => values.firstWhereOrNull((v) => v.name == raw);
}

final class _DateTimeCodec extends _MetadataCodec<DateTime> {
  const _DateTimeCodec();

  @override
  String encode(DateTime value) => value.toIso8601String();

  @override
  DateTime? decode(String raw) => DateTime.tryParse(raw);
}

final class _PrimitiveCodec<T extends Object> extends _MetadataCodec<T> {
  final T? Function(String) _parse;

  const _PrimitiveCodec._(this._parse);

  @override
  String encode(T value) => value.toString();

  @override
  T? decode(String raw) => _parse(raw);

  static const integer = _PrimitiveCodec<int>._(int.tryParse);
  static const real = _PrimitiveCodec<double>._(double.tryParse);
  static const boolean = _PrimitiveCodec<bool>._(bool.tryParse);
  static const string = _PrimitiveCodec<String>._(_identity);

  static String? _identity(String s) => s;
}

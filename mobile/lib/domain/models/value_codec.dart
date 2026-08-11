import 'dart:convert';

import 'package:immich_mobile/utils/semver.dart';

sealed class ValueCodec<T> {
  const ValueCodec();

  String encode(T value);
  T decode(String raw);

  static final Map<Type, ValueCodec<Object>> _primitives = {
    ..._register<int>(PrimitiveCodec.integer),
    ..._register<double>(PrimitiveCodec.real),
    ..._register<bool>(PrimitiveCodec.boolean),
    ..._register<String>(PrimitiveCodec.string),
    ..._register<DateTime>(const DateTimeCodec()),
  };

  static Map<Type, ValueCodec<Object>> _register<T>(ValueCodec<Object> codec) => {
    T: codec,
    // Reifies the nullable type T so it can be used as a key in the _primitives map
    _typeOf<T?>(): codec,
  };

  static Type _typeOf<T>() => T;

  static ValueCodec<T> forType<T>(Type runtimeType) {
    final codec = _primitives[runtimeType];
    if (codec == null) {
      throw StateError('No primitive codec for $runtimeType. Provide an explicit codec when defining the key.');
    }
    return codec as ValueCodec<T>;
  }
}

final class EnumCodec<T extends Enum> extends ValueCodec<T> {
  final List<T> values;

  const EnumCodec(this.values);

  @override
  String encode(T value) => value.name;

  @override
  T decode(String raw) => values.firstWhere((v) => v.name == raw);
}

final class DateTimeCodec extends ValueCodec<DateTime> {
  const DateTimeCodec();

  @override
  String encode(DateTime value) => value.toIso8601String();

  @override
  DateTime decode(String raw) => DateTime.parse(raw);
}

final class SemVerCodec extends ValueCodec<SemVer> {
  const SemVerCodec();

  @override
  String encode(SemVer value) => value.toString();

  @override
  SemVer decode(String raw) => SemVer.fromString(raw);
}

final class MapCodec<K extends Object, V extends Object> extends ValueCodec<Map<K, V>> {
  final ValueCodec<K> _keyCodec;
  final ValueCodec<V> _valueCodec;

  const MapCodec(this._keyCodec, this._valueCodec);

  @override
  String encode(Map<K, V> value) {
    final entries = <String, String>{};
    value.forEach((k, v) => entries[_keyCodec.encode(k)] = _valueCodec.encode(v));
    return jsonEncode(entries);
  }

  @override
  Map<K, V> decode(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        return {};
      }
      final result = <K, V>{};
      for (final entry in decoded.entries) {
        final rawKey = entry.key;
        final rawValue = entry.value;
        if (rawKey is! String || rawValue is! String) {
          continue;
        }
        final k = _keyCodec.decode(rawKey);
        final v = _valueCodec.decode(rawValue);
        result[k] = v;
      }
      return result;
    } on FormatException {
      return {};
    }
  }
}

final class ListCodec<T extends Object> extends ValueCodec<List<T>> {
  final ValueCodec<T> _elementCodec;

  const ListCodec(this._elementCodec);

  @override
  String encode(List<T> value) => jsonEncode(value.map(_elementCodec.encode).toList());

  @override
  List<T> decode(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) {
        return [];
      }
      final result = <T>[];
      for (final item in decoded) {
        if (item is! String) {
          return [];
        }
        final element = _elementCodec.decode(item);
        result.add(element);
      }
      return result;
    } on FormatException {
      return [];
    }
  }
}

final class PrimitiveCodec<T extends Object> extends ValueCodec<T> {
  final T Function(String) _parse;

  const PrimitiveCodec._(this._parse);

  @override
  String encode(T value) => value.toString();

  @override
  T decode(String raw) => _parse(raw);

  static const integer = PrimitiveCodec<int>._(int.parse);
  static const real = PrimitiveCodec<double>._(double.parse);
  static const boolean = PrimitiveCodec<bool>._(bool.parse);
  static const string = PrimitiveCodec<String>._(_identity);

  static String _identity(String s) => s;
}

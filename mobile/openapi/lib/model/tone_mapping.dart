//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Tone mapping
enum ToneMapping {
  hable._(r'hable'),
  mobius._(r'mobius'),
  reinhard._(r'reinhard'),
  disabled._(r'disabled'),
  ;

  /// Instantiate a new enum with the provided value.
  const ToneMapping._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [ToneMapping] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static ToneMapping? fromJson(dynamic value) => ToneMappingTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [ToneMapping]
  /// that were successfully decoded from the passed [JSON][json].
  static List<ToneMapping> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ToneMapping>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ToneMapping.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ToneMapping] to String,
/// and [decode] dynamic data back to [ToneMapping].
class ToneMappingTypeTransformer {
  factory ToneMappingTypeTransformer() => _instance ??= const ToneMappingTypeTransformer._();

  const ToneMappingTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(ToneMapping data) => data._value;

  /// Returns the instance of [ToneMapping] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ToneMapping? decode(dynamic data, {bool allowNull = true}) {
    if (data is ToneMapping) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'hable': return ToneMapping.hable;
        case r'mobius': return ToneMapping.mobius;
        case r'reinhard': return ToneMapping.reinhard;
        case r'disabled': return ToneMapping.disabled;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ToneMappingTypeTransformer? _instance;
}


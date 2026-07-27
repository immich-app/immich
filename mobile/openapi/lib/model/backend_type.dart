//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


enum BackendType {
  yucca._(r'yucca'),
  local._(r'local'),
  s3._(r's3'),
  ;

  /// Instantiate a new enum with the provided value.
  const BackendType._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [BackendType] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static BackendType? fromJson(dynamic value) => BackendTypeTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [BackendType]
  /// that were successfully decoded from the passed [JSON][json].
  static List<BackendType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BackendType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BackendType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [BackendType] to String,
/// and [decode] dynamic data back to [BackendType].
class BackendTypeTypeTransformer {
  factory BackendTypeTypeTransformer() => _instance ??= const BackendTypeTypeTransformer._();

  const BackendTypeTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(BackendType data) => data._value;

  /// Returns the instance of [BackendType] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  BackendType? decode(dynamic data, {bool allowNull = true}) {
    if (data is BackendType) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'yucca': return BackendType.yucca;
        case r'local': return BackendType.local;
        case r's3': return BackendType.s3;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static BackendTypeTypeTransformer? _instance;
}


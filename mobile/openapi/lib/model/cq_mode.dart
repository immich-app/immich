//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// CQ mode
enum CQMode {
  auto._(r'auto'),
  cqp._(r'cqp'),
  icq._(r'icq'),
  ;

  /// Instantiate a new enum with the provided value.
  const CQMode._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [CQMode] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static CQMode? fromJson(dynamic value) => CQModeTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [CQMode]
  /// that were successfully decoded from the passed [JSON][json].
  static List<CQMode> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CQMode>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CQMode.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [CQMode] to String,
/// and [decode] dynamic data back to [CQMode].
class CQModeTypeTransformer {
  factory CQModeTypeTransformer() => _instance ??= const CQModeTypeTransformer._();

  const CQModeTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(CQMode data) => data._value;

  /// Returns the instance of [CQMode] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  CQMode? decode(dynamic data, {bool allowNull = true}) {
    if (data is CQMode) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'auto': return CQMode.auto;
        case r'cqp': return CQMode.cqp;
        case r'icq': return CQMode.icq;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static CQModeTypeTransformer? _instance;
}


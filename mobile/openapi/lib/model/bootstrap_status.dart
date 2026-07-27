//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


enum BootstrapStatus {
  notReady._(r'not-ready'),
  ready._(r'ready'),
  error._(r'error'),
  ;

  /// Instantiate a new enum with the provided value.
  const BootstrapStatus._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [BootstrapStatus] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static BootstrapStatus? fromJson(dynamic value) => BootstrapStatusTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [BootstrapStatus]
  /// that were successfully decoded from the passed [JSON][json].
  static List<BootstrapStatus> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BootstrapStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BootstrapStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [BootstrapStatus] to String,
/// and [decode] dynamic data back to [BootstrapStatus].
class BootstrapStatusTypeTransformer {
  factory BootstrapStatusTypeTransformer() => _instance ??= const BootstrapStatusTypeTransformer._();

  const BootstrapStatusTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(BootstrapStatus data) => data._value;

  /// Returns the instance of [BootstrapStatus] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  BootstrapStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data is BootstrapStatus) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'not-ready': return BootstrapStatus.notReady;
        case r'ready': return BootstrapStatus.ready;
        case r'error': return BootstrapStatus.error;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static BootstrapStatusTypeTransformer? _instance;
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class TelemetryLevel {
  /// Instantiate a new enum with the provided [value].
  const TelemetryLevel._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const full = TelemetryLevel._(r'full');
  static const none = TelemetryLevel._(r'none');

  /// List of all possible values in this [enum][TelemetryLevel].
  static const values = <TelemetryLevel>[
    full,
    none,
  ];

  static TelemetryLevel? fromJson(dynamic value) => TelemetryLevelTypeTransformer().decode(value);

  static List<TelemetryLevel> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TelemetryLevel>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TelemetryLevel.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TelemetryLevel] to String,
/// and [decode] dynamic data back to [TelemetryLevel].
class TelemetryLevelTypeTransformer {
  factory TelemetryLevelTypeTransformer() => _instance ??= const TelemetryLevelTypeTransformer._();

  const TelemetryLevelTypeTransformer._();

  String encode(TelemetryLevel data) => data.value;

  /// Decodes a [dynamic value][data] to a TelemetryLevel.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TelemetryLevel? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'full': return TelemetryLevel.full;
        case r'none': return TelemetryLevel.none;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [TelemetryLevelTypeTransformer] instance.
  static TelemetryLevelTypeTransformer? _instance;
}


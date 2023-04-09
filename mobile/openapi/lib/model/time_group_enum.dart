//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class TimeGroupEnum {
  /// Instantiate a new enum with the provided [value].
  const TimeGroupEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const day = TimeGroupEnum._(r'day');
  static const month = TimeGroupEnum._(r'month');

  /// List of all possible values in this [enum][TimeGroupEnum].
  static const values = <TimeGroupEnum>[
    day,
    month,
  ];

  static TimeGroupEnum? fromJson(dynamic value) => TimeGroupEnumTypeTransformer().decode(value);

  static List<TimeGroupEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TimeGroupEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TimeGroupEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TimeGroupEnum] to String,
/// and [decode] dynamic data back to [TimeGroupEnum].
class TimeGroupEnumTypeTransformer {
  factory TimeGroupEnumTypeTransformer() => _instance ??= const TimeGroupEnumTypeTransformer._();

  const TimeGroupEnumTypeTransformer._();

  String encode(TimeGroupEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a TimeGroupEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TimeGroupEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'day': return TimeGroupEnum.day;
        case r'month': return TimeGroupEnum.month;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [TimeGroupEnumTypeTransformer] instance.
  static TimeGroupEnumTypeTransformer? _instance;
}


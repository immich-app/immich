//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Type of calendar heatmap
class CalendarHeatmapType {
  /// Instantiate a new enum with the provided [value].
  const CalendarHeatmapType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const upload = CalendarHeatmapType._(r'Upload');
  static const taken = CalendarHeatmapType._(r'Taken');

  /// List of all possible values in this [enum][CalendarHeatmapType].
  static const values = <CalendarHeatmapType>[
    upload,
    taken,
  ];

  static CalendarHeatmapType? fromJson(dynamic value) => CalendarHeatmapTypeTypeTransformer().decode(value);

  static List<CalendarHeatmapType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CalendarHeatmapType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CalendarHeatmapType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [CalendarHeatmapType] to String,
/// and [decode] dynamic data back to [CalendarHeatmapType].
class CalendarHeatmapTypeTypeTransformer {
  factory CalendarHeatmapTypeTypeTransformer() => _instance ??= const CalendarHeatmapTypeTypeTransformer._();

  const CalendarHeatmapTypeTypeTransformer._();

  String encode(CalendarHeatmapType data) => data.value;

  /// Decodes a [dynamic value][data] to a CalendarHeatmapType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  CalendarHeatmapType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'Upload': return CalendarHeatmapType.upload;
        case r'Taken': return CalendarHeatmapType.taken;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [CalendarHeatmapTypeTypeTransformer] instance.
  static CalendarHeatmapTypeTypeTransformer? _instance;
}


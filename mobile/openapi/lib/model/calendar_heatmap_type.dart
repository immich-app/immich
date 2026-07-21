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
enum CalendarHeatmapType {
  upload._(r'Upload'),
  taken._(r'Taken'),
  ;

  /// Instantiate a new enum with the provided value.
  const CalendarHeatmapType._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [CalendarHeatmapType] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static CalendarHeatmapType? fromJson(dynamic value) => CalendarHeatmapTypeTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [CalendarHeatmapType]
  /// that were successfully decoded from the passed [JSON][json].
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

  /// Encodes this enum as a value suitable for JSON.
  String encode(CalendarHeatmapType data) => data._value;

  /// Returns the instance of [CalendarHeatmapType] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  CalendarHeatmapType? decode(dynamic data, {bool allowNull = true}) {
    if (data is CalendarHeatmapType) {
      return data;
    }
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

  /// The singleton instance of this transformer.
  static CalendarHeatmapTypeTypeTransformer? _instance;
}


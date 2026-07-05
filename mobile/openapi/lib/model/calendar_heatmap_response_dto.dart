//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CalendarHeatmapResponseDto {
  /// Returns a new [CalendarHeatmapResponseDto] instance.
  CalendarHeatmapResponseDto({
    required this.from,
    this.series = const [],
    required this.to,
    required this.totalCount,
  });

  /// Start date in UTC
  String from;

  List<CalendarHeatmapResponseDtoSeriesInner> series;

  /// End date in UTC
  String to;

  /// Total activity count over the period
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int totalCount;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CalendarHeatmapResponseDto &&
    other.from == from &&
    _deepEquality.equals(other.series, series) &&
    other.to == to &&
    other.totalCount == totalCount;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (from.hashCode) +
    (series.hashCode) +
    (to.hashCode) +
    (totalCount.hashCode);

  @override
  String toString() => 'CalendarHeatmapResponseDto[from=$from, series=$series, to=$to, totalCount=$totalCount]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'from'] = this.from;
      json[r'series'] = this.series;
      json[r'to'] = this.to;
      json[r'totalCount'] = this.totalCount;
    return json;
  }

  /// Returns a new [CalendarHeatmapResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CalendarHeatmapResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "CalendarHeatmapResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CalendarHeatmapResponseDto(
        from: mapValueOfType<String>(json, r'from')!,
        series: CalendarHeatmapResponseDtoSeriesInner.listFromJson(json[r'series']),
        to: mapValueOfType<String>(json, r'to')!,
        totalCount: mapValueOfType<int>(json, r'totalCount')!,
      );
    }
    return null;
  }

  static List<CalendarHeatmapResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CalendarHeatmapResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CalendarHeatmapResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CalendarHeatmapResponseDto> mapFromJson(dynamic json) {
    final map = <String, CalendarHeatmapResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CalendarHeatmapResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CalendarHeatmapResponseDto-objects as value to a dart map
  static Map<String, List<CalendarHeatmapResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CalendarHeatmapResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CalendarHeatmapResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'from',
    'series',
    'to',
    'totalCount',
  };
}


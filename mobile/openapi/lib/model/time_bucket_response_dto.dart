//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TimeBucketResponseDto {
  /// Returns a new [TimeBucketResponseDto] instance.
  TimeBucketResponseDto({
    required this.count,
    required this.timeBucket,
  });

  int count;

  String timeBucket;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TimeBucketResponseDto &&
    other.count == count &&
    other.timeBucket == timeBucket;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (count.hashCode) +
    (timeBucket.hashCode);

  @override
  String toString() => 'TimeBucketResponseDto[count=$count, timeBucket=$timeBucket]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'count'] = this.count;
      json[r'timeBucket'] = this.timeBucket;
    return json;
  }

  /// Returns a new [TimeBucketResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TimeBucketResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TimeBucketResponseDto(
        count: mapValueOfType<int>(json, r'count')!,
        timeBucket: mapValueOfType<String>(json, r'timeBucket')!,
      );
    }
    return null;
  }

  static List<TimeBucketResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TimeBucketResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TimeBucketResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TimeBucketResponseDto> mapFromJson(dynamic json) {
    final map = <String, TimeBucketResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TimeBucketResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TimeBucketResponseDto-objects as value to a dart map
  static Map<String, List<TimeBucketResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TimeBucketResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TimeBucketResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'count',
    'timeBucket',
  };
}


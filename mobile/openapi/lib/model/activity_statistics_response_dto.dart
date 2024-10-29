//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ActivityStatisticsResponseDto {
  /// Returns a new [ActivityStatisticsResponseDto] instance.
  ActivityStatisticsResponseDto({
    required this.comments,
  });

  int comments;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ActivityStatisticsResponseDto &&
    other.comments == comments;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (comments.hashCode);

  @override
  String toString() => 'ActivityStatisticsResponseDto[comments=$comments]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'comments'] = this.comments;
    return json;
  }

  /// Returns a new [ActivityStatisticsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ActivityStatisticsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ActivityStatisticsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ActivityStatisticsResponseDto(
        comments: mapValueOfType<int>(json, r'comments')!,
      );
    }
    return null;
  }

  static List<ActivityStatisticsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityStatisticsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityStatisticsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ActivityStatisticsResponseDto> mapFromJson(dynamic json) {
    final map = <String, ActivityStatisticsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ActivityStatisticsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ActivityStatisticsResponseDto-objects as value to a dart map
  static Map<String, List<ActivityStatisticsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ActivityStatisticsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ActivityStatisticsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'comments',
  };
}


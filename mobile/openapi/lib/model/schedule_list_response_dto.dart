//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ScheduleListResponseDto {
  /// Returns a new [ScheduleListResponseDto] instance.
  ScheduleListResponseDto({
    this.schedules = const [],
  });

  List<ScheduleDto> schedules;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ScheduleListResponseDto &&
    _deepEquality.equals(other.schedules, schedules);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (schedules.hashCode);

  @override
  String toString() => 'ScheduleListResponseDto[schedules=$schedules]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'schedules'] = this.schedules;
    return json;
  }

  /// Returns a new [ScheduleListResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ScheduleListResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ScheduleListResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ScheduleListResponseDto(
        schedules: ScheduleDto.listFromJson(json[r'schedules']),
      );
    }
    return null;
  }

  static List<ScheduleListResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ScheduleListResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ScheduleListResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ScheduleListResponseDto> mapFromJson(dynamic json) {
    final map = <String, ScheduleListResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ScheduleListResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ScheduleListResponseDto-objects as value to a dart map
  static Map<String, List<ScheduleListResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ScheduleListResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ScheduleListResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'schedules',
  };
}


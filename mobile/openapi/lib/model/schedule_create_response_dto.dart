//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ScheduleCreateResponseDto {
  /// Returns a new [ScheduleCreateResponseDto] instance.
  ScheduleCreateResponseDto({
    required this.schedule,
  });

  ScheduleDto schedule;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ScheduleCreateResponseDto &&
    other.schedule == schedule;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (schedule.hashCode);

  @override
  String toString() => 'ScheduleCreateResponseDto[schedule=$schedule]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'schedule'] = this.schedule;
    return json;
  }

  /// Returns a new [ScheduleCreateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ScheduleCreateResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ScheduleCreateResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ScheduleCreateResponseDto(
        schedule: ScheduleDto.fromJson(json[r'schedule'])!,
      );
    }
    return null;
  }

  static List<ScheduleCreateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ScheduleCreateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ScheduleCreateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ScheduleCreateResponseDto> mapFromJson(dynamic json) {
    final map = <String, ScheduleCreateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ScheduleCreateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ScheduleCreateResponseDto-objects as value to a dart map
  static Map<String, List<ScheduleCreateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ScheduleCreateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ScheduleCreateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'schedule',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class JobCountsDto {
  /// Returns a new [JobCountsDto] instance.
  JobCountsDto({
    required this.active,
    required this.completed,
    required this.delayed,
    required this.failed,
    required this.paused,
    required this.waiting,
  });

  int active;

  int completed;

  int delayed;

  int failed;

  int paused;

  int waiting;

  @override
  bool operator ==(Object other) => identical(this, other) || other is JobCountsDto &&
    other.active == active &&
    other.completed == completed &&
    other.delayed == delayed &&
    other.failed == failed &&
    other.paused == paused &&
    other.waiting == waiting;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (active.hashCode) +
    (completed.hashCode) +
    (delayed.hashCode) +
    (failed.hashCode) +
    (paused.hashCode) +
    (waiting.hashCode);

  @override
  String toString() => 'JobCountsDto[active=$active, completed=$completed, delayed=$delayed, failed=$failed, paused=$paused, waiting=$waiting]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'active'] = this.active;
      json[r'completed'] = this.completed;
      json[r'delayed'] = this.delayed;
      json[r'failed'] = this.failed;
      json[r'paused'] = this.paused;
      json[r'waiting'] = this.waiting;
    return json;
  }

  /// Returns a new [JobCountsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static JobCountsDto? fromJson(dynamic value) {
    upgradeDto(value, "JobCountsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return JobCountsDto(
        active: mapValueOfType<int>(json, r'active')!,
        completed: mapValueOfType<int>(json, r'completed')!,
        delayed: mapValueOfType<int>(json, r'delayed')!,
        failed: mapValueOfType<int>(json, r'failed')!,
        paused: mapValueOfType<int>(json, r'paused')!,
        waiting: mapValueOfType<int>(json, r'waiting')!,
      );
    }
    return null;
  }

  static List<JobCountsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobCountsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobCountsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, JobCountsDto> mapFromJson(dynamic json) {
    final map = <String, JobCountsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = JobCountsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of JobCountsDto-objects as value to a dart map
  static Map<String, List<JobCountsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<JobCountsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = JobCountsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'active',
    'completed',
    'delayed',
    'failed',
    'paused',
    'waiting',
  };
}


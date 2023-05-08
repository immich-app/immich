//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

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
    required this.failed,
    required this.delayed,
    required this.waiting,
    required this.paused,
  });

  int active;

  int completed;

  int failed;

  int delayed;

  int waiting;

  int paused;

  @override
  bool operator ==(Object other) => identical(this, other) || other is JobCountsDto &&
     other.active == active &&
     other.completed == completed &&
     other.failed == failed &&
     other.delayed == delayed &&
     other.waiting == waiting &&
     other.paused == paused;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (active.hashCode) +
    (completed.hashCode) +
    (failed.hashCode) +
    (delayed.hashCode) +
    (waiting.hashCode) +
    (paused.hashCode);

  @override
  String toString() => 'JobCountsDto[active=$active, completed=$completed, failed=$failed, delayed=$delayed, waiting=$waiting, paused=$paused]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'active'] = this.active;
      json[r'completed'] = this.completed;
      json[r'failed'] = this.failed;
      json[r'delayed'] = this.delayed;
      json[r'waiting'] = this.waiting;
      json[r'paused'] = this.paused;
    return json;
  }

  /// Returns a new [JobCountsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static JobCountsDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "JobCountsDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "JobCountsDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return JobCountsDto(
        active: mapValueOfType<int>(json, r'active')!,
        completed: mapValueOfType<int>(json, r'completed')!,
        failed: mapValueOfType<int>(json, r'failed')!,
        delayed: mapValueOfType<int>(json, r'delayed')!,
        waiting: mapValueOfType<int>(json, r'waiting')!,
        paused: mapValueOfType<int>(json, r'paused')!,
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
    'failed',
    'delayed',
    'waiting',
    'paused',
  };
}


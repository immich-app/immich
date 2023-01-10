//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class JobCounts {
  /// Returns a new [JobCounts] instance.
  JobCounts({
    required this.active,
    required this.completed,
    required this.failed,
    required this.delayed,
    required this.waiting,
  });

  int active;

  int completed;

  int failed;

  int delayed;

  int waiting;

  @override
  bool operator ==(Object other) => identical(this, other) || other is JobCounts &&
     other.active == active &&
     other.completed == completed &&
     other.failed == failed &&
     other.delayed == delayed &&
     other.waiting == waiting;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (active.hashCode) +
    (completed.hashCode) +
    (failed.hashCode) +
    (delayed.hashCode) +
    (waiting.hashCode);

  @override
  String toString() => 'JobCounts[active=$active, completed=$completed, failed=$failed, delayed=$delayed, waiting=$waiting]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'active'] = this.active;
      json[r'completed'] = this.completed;
      json[r'failed'] = this.failed;
      json[r'delayed'] = this.delayed;
      json[r'waiting'] = this.waiting;
    return json;
  }

  /// Returns a new [JobCounts] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static JobCounts? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "JobCounts[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "JobCounts[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return JobCounts(
        active: mapValueOfType<int>(json, r'active')!,
        completed: mapValueOfType<int>(json, r'completed')!,
        failed: mapValueOfType<int>(json, r'failed')!,
        delayed: mapValueOfType<int>(json, r'delayed')!,
        waiting: mapValueOfType<int>(json, r'waiting')!,
      );
    }
    return null;
  }

  static List<JobCounts>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobCounts>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobCounts.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, JobCounts> mapFromJson(dynamic json) {
    final map = <String, JobCounts>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = JobCounts.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of JobCounts-objects as value to a dart map
  static Map<String, List<JobCounts>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<JobCounts>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = JobCounts.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
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
  };
}


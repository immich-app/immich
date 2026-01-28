//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class JobMemoryCleanup {
  /// Returns a new [JobMemoryCleanup] instance.
  JobMemoryCleanup({
    required this.data,
    required this.name,
  });

  BaseJobData data;

  MemoryCleanup name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is JobMemoryCleanup &&
    other.data == data &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (data.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'JobMemoryCleanup[data=$data, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'data'] = this.data;
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [JobMemoryCleanup] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static JobMemoryCleanup? fromJson(dynamic value) {
    upgradeDto(value, "JobMemoryCleanup");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return JobMemoryCleanup(
        data: BaseJobData.fromJson(json[r'data'])!,
        name: MemoryCleanup.fromJson(json[r'name'])!,
      );
    }
    return null;
  }

  static List<JobMemoryCleanup> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobMemoryCleanup>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobMemoryCleanup.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, JobMemoryCleanup> mapFromJson(dynamic json) {
    final map = <String, JobMemoryCleanup>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = JobMemoryCleanup.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of JobMemoryCleanup-objects as value to a dart map
  static Map<String, List<JobMemoryCleanup>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<JobMemoryCleanup>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = JobMemoryCleanup.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'data',
    'name',
  };
}


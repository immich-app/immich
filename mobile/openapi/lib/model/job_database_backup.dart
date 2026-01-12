//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class JobDatabaseBackup {
  /// Returns a new [JobDatabaseBackup] instance.
  JobDatabaseBackup({
    required this.data,
    required this.name,
  });

  BaseJobData data;

  num name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is JobDatabaseBackup &&
    other.data == data &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (data.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'JobDatabaseBackup[data=$data, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'data'] = this.data;
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [JobDatabaseBackup] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static JobDatabaseBackup? fromJson(dynamic value) {
    upgradeDto(value, "JobDatabaseBackup");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return JobDatabaseBackup(
        data: BaseJobData.fromJson(json[r'data'])!,
        name: num.parse('${json[r'name']}'),
      );
    }
    return null;
  }

  static List<JobDatabaseBackup> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobDatabaseBackup>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobDatabaseBackup.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, JobDatabaseBackup> mapFromJson(dynamic json) {
    final map = <String, JobDatabaseBackup>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = JobDatabaseBackup.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of JobDatabaseBackup-objects as value to a dart map
  static Map<String, List<JobDatabaseBackup>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<JobDatabaseBackup>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = JobDatabaseBackup.listFromJson(entry.value, growable: growable,);
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


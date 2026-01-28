//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class JobUserDeleteCheck {
  /// Returns a new [JobUserDeleteCheck] instance.
  JobUserDeleteCheck({
    required this.data,
    required this.name,
  });

  BaseJobData data;

  UserDeleteCheck name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is JobUserDeleteCheck &&
    other.data == data &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (data.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'JobUserDeleteCheck[data=$data, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'data'] = this.data;
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [JobUserDeleteCheck] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static JobUserDeleteCheck? fromJson(dynamic value) {
    upgradeDto(value, "JobUserDeleteCheck");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return JobUserDeleteCheck(
        data: BaseJobData.fromJson(json[r'data'])!,
        name: UserDeleteCheck.fromJson(json[r'name'])!,
      );
    }
    return null;
  }

  static List<JobUserDeleteCheck> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobUserDeleteCheck>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobUserDeleteCheck.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, JobUserDeleteCheck> mapFromJson(dynamic json) {
    final map = <String, JobUserDeleteCheck>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = JobUserDeleteCheck.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of JobUserDeleteCheck-objects as value to a dart map
  static Map<String, List<JobUserDeleteCheck>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<JobUserDeleteCheck>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = JobUserDeleteCheck.listFromJson(entry.value, growable: growable,);
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


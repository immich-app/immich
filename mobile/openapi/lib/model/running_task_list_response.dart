//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RunningTaskListResponse {
  /// Returns a new [RunningTaskListResponse] instance.
  RunningTaskListResponse({
    this.tasks = const [],
  });

  List<RunningTaskDto> tasks;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RunningTaskListResponse &&
    _deepEquality.equals(other.tasks, tasks);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (tasks.hashCode);

  @override
  String toString() => 'RunningTaskListResponse[tasks=$tasks]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'tasks'] = this.tasks;
    return json;
  }

  /// Returns a new [RunningTaskListResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RunningTaskListResponse? fromJson(dynamic value) {
    upgradeDto(value, "RunningTaskListResponse");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RunningTaskListResponse(
        tasks: RunningTaskDto.listFromJson(json[r'tasks']),
      );
    }
    return null;
  }

  static List<RunningTaskListResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RunningTaskListResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RunningTaskListResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RunningTaskListResponse> mapFromJson(dynamic json) {
    final map = <String, RunningTaskListResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RunningTaskListResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RunningTaskListResponse-objects as value to a dart map
  static Map<String, List<RunningTaskListResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RunningTaskListResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RunningTaskListResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'tasks',
  };
}


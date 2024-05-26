//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class JobCommandDto {
  /// Returns a new [JobCommandDto] instance.
  JobCommandDto({
    required this.command,
    required this.force,
  });

  JobCommand command;

  bool force;

  @override
  bool operator ==(Object other) => identical(this, other) || other is JobCommandDto &&
    other.command == command &&
    other.force == force;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (command.hashCode) +
    (force.hashCode);

  @override
  String toString() => 'JobCommandDto[command=$command, force=$force]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'command'] = this.command;
      json[r'force'] = this.force;
    return json;
  }

  /// Returns a new [JobCommandDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static JobCommandDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return JobCommandDto(
        command: JobCommand.fromJson(json[r'command'])!,
        force: mapValueOfType<bool>(json, r'force')!,
      );
    }
    return null;
  }

  static List<JobCommandDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobCommandDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobCommandDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, JobCommandDto> mapFromJson(dynamic json) {
    final map = <String, JobCommandDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = JobCommandDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of JobCommandDto-objects as value to a dart map
  static Map<String, List<JobCommandDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<JobCommandDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = JobCommandDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'command',
    'force',
  };
}


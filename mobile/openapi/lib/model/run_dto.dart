//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RunDto {
  /// Returns a new [RunDto] instance.
  RunDto({
    required this.end,
    required this.id,
    required this.logFilePath,
    required this.start,
    required this.status,
  });

  String end;

  String id;

  String logFilePath;

  String start;

  RunStatus status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RunDto &&
    other.end == end &&
    other.id == id &&
    other.logFilePath == logFilePath &&
    other.start == start &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (end.hashCode) +
    (id.hashCode) +
    (logFilePath.hashCode) +
    (start.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'RunDto[end=$end, id=$id, logFilePath=$logFilePath, start=$start, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'end'] = this.end;
      json[r'id'] = this.id;
      json[r'logFilePath'] = this.logFilePath;
      json[r'start'] = this.start;
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [RunDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RunDto? fromJson(dynamic value) {
    upgradeDto(value, "RunDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RunDto(
        end: mapValueOfType<String>(json, r'end')!,
        id: mapValueOfType<String>(json, r'id')!,
        logFilePath: mapValueOfType<String>(json, r'logFilePath')!,
        start: mapValueOfType<String>(json, r'start')!,
        status: RunStatus.fromJson(json[r'status'])!,
      );
    }
    return null;
  }

  static List<RunDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RunDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RunDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RunDto> mapFromJson(dynamic json) {
    final map = <String, RunDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RunDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RunDto-objects as value to a dart map
  static Map<String, List<RunDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RunDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RunDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'end',
    'id',
    'logFilePath',
    'start',
    'status',
  };
}


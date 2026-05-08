//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RunResponseDto {
  /// Returns a new [RunResponseDto] instance.
  RunResponseDto({
    required this.run,
  });

  RunDto run;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RunResponseDto &&
    other.run == run;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (run.hashCode);

  @override
  String toString() => 'RunResponseDto[run=$run]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'run'] = this.run;
    return json;
  }

  /// Returns a new [RunResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RunResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "RunResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RunResponseDto(
        run: RunDto.fromJson(json[r'run'])!,
      );
    }
    return null;
  }

  static List<RunResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RunResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RunResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RunResponseDto> mapFromJson(dynamic json) {
    final map = <String, RunResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RunResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RunResponseDto-objects as value to a dart map
  static Map<String, List<RunResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RunResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RunResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'run',
  };
}


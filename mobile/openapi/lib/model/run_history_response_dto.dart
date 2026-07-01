//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RunHistoryResponseDto {
  /// Returns a new [RunHistoryResponseDto] instance.
  RunHistoryResponseDto({
    this.runs = const [],
  });

  List<RunDto> runs;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RunHistoryResponseDto &&
    _deepEquality.equals(other.runs, runs);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (runs.hashCode);

  @override
  String toString() => 'RunHistoryResponseDto[runs=$runs]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'runs'] = this.runs;
    return json;
  }

  /// Returns a new [RunHistoryResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RunHistoryResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "RunHistoryResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RunHistoryResponseDto(
        runs: RunDto.listFromJson(json[r'runs']),
      );
    }
    return null;
  }

  static List<RunHistoryResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RunHistoryResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RunHistoryResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RunHistoryResponseDto> mapFromJson(dynamic json) {
    final map = <String, RunHistoryResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RunHistoryResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RunHistoryResponseDto-objects as value to a dart map
  static Map<String, List<RunHistoryResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RunHistoryResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RunHistoryResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'runs',
  };
}


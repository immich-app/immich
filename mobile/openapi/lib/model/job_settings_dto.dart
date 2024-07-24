//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class JobSettingsDto {
  /// Returns a new [JobSettingsDto] instance.
  JobSettingsDto({
    required this.concurrency,
  });

  /// Minimum value: 1
  int concurrency;

  @override
  bool operator ==(Object other) => identical(this, other) || other is JobSettingsDto &&
    other.concurrency == concurrency;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (concurrency.hashCode);

  @override
  String toString() => 'JobSettingsDto[concurrency=$concurrency]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'concurrency'] = this.concurrency;
    return json;
  }

  /// Returns a new [JobSettingsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static JobSettingsDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return JobSettingsDto(
        concurrency: mapValueOfType<int>(json, r'concurrency')!,
      );
    }
    return null;
  }

  static List<JobSettingsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobSettingsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobSettingsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, JobSettingsDto> mapFromJson(dynamic json) {
    final map = <String, JobSettingsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = JobSettingsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of JobSettingsDto-objects as value to a dart map
  static Map<String, List<JobSettingsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<JobSettingsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = JobSettingsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'concurrency',
  };
}


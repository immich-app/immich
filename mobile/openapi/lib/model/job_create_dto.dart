//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class JobCreateDto {
  /// Returns a new [JobCreateDto] instance.
  JobCreateDto({
    required this.name,
  });

  ManualJobName name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is JobCreateDto &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name.hashCode);

  @override
  String toString() => 'JobCreateDto[name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [JobCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static JobCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "JobCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return JobCreateDto(
        name: ManualJobName.fromJson(json[r'name'])!,
      );
    }
    return null;
  }

  static List<JobCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, JobCreateDto> mapFromJson(dynamic json) {
    final map = <String, JobCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = JobCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of JobCreateDto-objects as value to a dart map
  static Map<String, List<JobCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<JobCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = JobCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
  };
}


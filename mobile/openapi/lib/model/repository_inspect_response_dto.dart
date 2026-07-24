//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryInspectResponseDto {
  /// Returns a new [RepositoryInspectResponseDto] instance.
  RepositoryInspectResponseDto({
    this.repositories = const [],
  });

  List<InspectedLocalRepositoryDto> repositories;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryInspectResponseDto &&
    _deepEquality.equals(other.repositories, repositories);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (repositories.hashCode);

  @override
  String toString() => 'RepositoryInspectResponseDto[repositories=$repositories]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'repositories'] = this.repositories;
    return json;
  }

  /// Returns a new [RepositoryInspectResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryInspectResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryInspectResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryInspectResponseDto(
        repositories: InspectedLocalRepositoryDto.listFromJson(json[r'repositories']),
      );
    }
    return null;
  }

  static List<RepositoryInspectResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryInspectResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryInspectResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryInspectResponseDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryInspectResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryInspectResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryInspectResponseDto-objects as value to a dart map
  static Map<String, List<RepositoryInspectResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryInspectResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryInspectResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'repositories',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryCreateResponseDto {
  /// Returns a new [RepositoryCreateResponseDto] instance.
  RepositoryCreateResponseDto({
    required this.repository,
  });

  LocalRepositoryDto repository;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryCreateResponseDto &&
    other.repository == repository;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (repository.hashCode);

  @override
  String toString() => 'RepositoryCreateResponseDto[repository=$repository]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'repository'] = this.repository;
    return json;
  }

  /// Returns a new [RepositoryCreateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryCreateResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryCreateResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryCreateResponseDto(
        repository: LocalRepositoryDto.fromJson(json[r'repository'])!,
      );
    }
    return null;
  }

  static List<RepositoryCreateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryCreateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryCreateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryCreateResponseDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryCreateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryCreateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryCreateResponseDto-objects as value to a dart map
  static Map<String, List<RepositoryCreateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryCreateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryCreateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'repository',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryUpdateResponseDto {
  /// Returns a new [RepositoryUpdateResponseDto] instance.
  RepositoryUpdateResponseDto({
    required this.repository,
  });

  LocalRepositoryDto repository;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryUpdateResponseDto &&
    other.repository == repository;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (repository.hashCode);

  @override
  String toString() => 'RepositoryUpdateResponseDto[repository=$repository]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'repository'] = this.repository;
    return json;
  }

  /// Returns a new [RepositoryUpdateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryUpdateResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryUpdateResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryUpdateResponseDto(
        repository: LocalRepositoryDto.fromJson(json[r'repository'])!,
      );
    }
    return null;
  }

  static List<RepositoryUpdateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryUpdateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryUpdateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryUpdateResponseDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryUpdateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryUpdateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryUpdateResponseDto-objects as value to a dart map
  static Map<String, List<RepositoryUpdateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryUpdateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryUpdateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'repository',
  };
}


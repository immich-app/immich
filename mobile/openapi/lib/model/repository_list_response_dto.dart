//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryListResponseDto {
  /// Returns a new [RepositoryListResponseDto] instance.
  RepositoryListResponseDto({
    this.repositories = const [],
  });

  List<LocalRepositoryDto> repositories;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryListResponseDto &&
    _deepEquality.equals(other.repositories, repositories);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (repositories.hashCode);

  @override
  String toString() => 'RepositoryListResponseDto[repositories=$repositories]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'repositories'] = this.repositories;
    return json;
  }

  /// Returns a new [RepositoryListResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryListResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryListResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryListResponseDto(
        repositories: LocalRepositoryDto.listFromJson(json[r'repositories']),
      );
    }
    return null;
  }

  static List<RepositoryListResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryListResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryListResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryListResponseDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryListResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryListResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryListResponseDto-objects as value to a dart map
  static Map<String, List<RepositoryListResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryListResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryListResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'repositories',
  };
}


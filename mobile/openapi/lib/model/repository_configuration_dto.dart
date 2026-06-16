//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryConfigurationDto {
  /// Returns a new [RepositoryConfigurationDto] instance.
  RepositoryConfigurationDto({
    this.paths = const [],
    this.retentionPolicy = const Optional.absent(),
  });

  List<String> paths;

  Optional<RetentionPolicyDto?> retentionPolicy;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryConfigurationDto &&
    _deepEquality.equals(other.paths, paths) &&
    other.retentionPolicy == retentionPolicy;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (paths.hashCode) +
    (retentionPolicy == null ? 0 : retentionPolicy!.hashCode);

  @override
  String toString() => 'RepositoryConfigurationDto[paths=$paths, retentionPolicy=$retentionPolicy]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'paths'] = this.paths;
    if (this.retentionPolicy.isPresent) {
      final value = this.retentionPolicy.value;
      json[r'retentionPolicy'] = value;
    }
    return json;
  }

  /// Returns a new [RepositoryConfigurationDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryConfigurationDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryConfigurationDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryConfigurationDto(
        paths: json[r'paths'] is Iterable
            ? (json[r'paths'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        retentionPolicy: json.containsKey(r'retentionPolicy') ? Optional.present(RetentionPolicyDto.fromJson(json[r'retentionPolicy'])) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<RepositoryConfigurationDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryConfigurationDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryConfigurationDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryConfigurationDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryConfigurationDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryConfigurationDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryConfigurationDto-objects as value to a dart map
  static Map<String, List<RepositoryConfigurationDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryConfigurationDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryConfigurationDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'paths',
  };
}


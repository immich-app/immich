//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryUpdateRequestDto {
  /// Returns a new [RepositoryUpdateRequestDto] instance.
  RepositoryUpdateRequestDto({
    this.name = const Optional.absent(),
    this.paths = const Optional.present(const []),
    this.retentionPolicy = const Optional.absent(),
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> name;

  Optional<List<String>?> paths;

  Optional<RetentionPolicyDto?> retentionPolicy;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryUpdateRequestDto &&
    other.name == name &&
    _deepEquality.equals(other.paths, paths) &&
    other.retentionPolicy == retentionPolicy;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name == null ? 0 : name!.hashCode) +
    (paths.hashCode) +
    (retentionPolicy == null ? 0 : retentionPolicy!.hashCode);

  @override
  String toString() => 'RepositoryUpdateRequestDto[name=$name, paths=$paths, retentionPolicy=$retentionPolicy]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.name.isPresent) {
      final value = this.name.value;
      json[r'name'] = value;
    }
    if (this.paths.isPresent) {
      final value = this.paths.value;
      json[r'paths'] = value;
    }
    if (this.retentionPolicy.isPresent) {
      final value = this.retentionPolicy.value;
      json[r'retentionPolicy'] = value;
    }
    return json;
  }

  /// Returns a new [RepositoryUpdateRequestDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryUpdateRequestDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryUpdateRequestDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryUpdateRequestDto(
        name: json.containsKey(r'name') ? Optional.present(mapValueOfType<String>(json, r'name')) : const Optional.absent(),
        paths: json.containsKey(r'paths') ? Optional.present(json[r'paths'] is Iterable
            ? (json[r'paths'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        retentionPolicy: json.containsKey(r'retentionPolicy') ? Optional.present(RetentionPolicyDto.fromJson(json[r'retentionPolicy'])) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<RepositoryUpdateRequestDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryUpdateRequestDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryUpdateRequestDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryUpdateRequestDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryUpdateRequestDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryUpdateRequestDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryUpdateRequestDto-objects as value to a dart map
  static Map<String, List<RepositoryUpdateRequestDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryUpdateRequestDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryUpdateRequestDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


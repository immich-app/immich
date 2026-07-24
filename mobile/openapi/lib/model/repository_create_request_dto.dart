//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryCreateRequestDto {
  /// Returns a new [RepositoryCreateRequestDto] instance.
  RepositoryCreateRequestDto({
    required this.name,
    this.paths = const Optional.present(const []),
    required this.worm,
  });

  String name;

  Optional<List<String>?> paths;

  bool worm;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryCreateRequestDto &&
    other.name == name &&
    _deepEquality.equals(other.paths, paths) &&
    other.worm == worm;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name.hashCode) +
    (paths.hashCode) +
    (worm.hashCode);

  @override
  String toString() => 'RepositoryCreateRequestDto[name=$name, paths=$paths, worm=$worm]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'name'] = this.name;
    if (this.paths.isPresent) {
      final value = this.paths.value;
      json[r'paths'] = value;
    }
      json[r'worm'] = this.worm;
    return json;
  }

  /// Returns a new [RepositoryCreateRequestDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryCreateRequestDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryCreateRequestDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryCreateRequestDto(
        name: mapValueOfType<String>(json, r'name')!,
        paths: json.containsKey(r'paths') ? Optional.present(json[r'paths'] is Iterable
            ? (json[r'paths'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        worm: mapValueOfType<bool>(json, r'worm')!,
      );
    }
    return null;
  }

  static List<RepositoryCreateRequestDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryCreateRequestDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryCreateRequestDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryCreateRequestDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryCreateRequestDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryCreateRequestDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryCreateRequestDto-objects as value to a dart map
  static Map<String, List<RepositoryCreateRequestDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryCreateRequestDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryCreateRequestDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
    'worm',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateLibraryDto {
  /// Returns a new [CreateLibraryDto] instance.
  CreateLibraryDto({
    this.exclusionPatterns = const Optional.present(const []),
    this.importPaths = const Optional.present(const []),
    this.name = const Optional.absent(),
    required this.ownerId,
  });

  /// Exclusion patterns (max 128)
  Optional<List<String>?> exclusionPatterns;

  /// Import paths (max 128)
  Optional<List<String>?> importPaths;

  /// Library name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> name;

  /// Owner user ID
  String ownerId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateLibraryDto &&
    _deepEquality.equals(other.exclusionPatterns, exclusionPatterns) &&
    _deepEquality.equals(other.importPaths, importPaths) &&
    other.name == name &&
    other.ownerId == ownerId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (exclusionPatterns.hashCode) +
    (importPaths.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (ownerId.hashCode);

  @override
  String toString() => 'CreateLibraryDto[exclusionPatterns=$exclusionPatterns, importPaths=$importPaths, name=$name, ownerId=$ownerId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.exclusionPatterns.isPresent) {
      final value = this.exclusionPatterns.value;
      json[r'exclusionPatterns'] = value;
    }
    if (this.importPaths.isPresent) {
      final value = this.importPaths.value;
      json[r'importPaths'] = value;
    }
    if (this.name.isPresent) {
      final value = this.name.value;
      json[r'name'] = value;
    }
      json[r'ownerId'] = this.ownerId;
    return json;
  }

  /// Returns a new [CreateLibraryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateLibraryDto? fromJson(dynamic value) {
    upgradeDto(value, "CreateLibraryDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CreateLibraryDto(
        exclusionPatterns: json.containsKey(r'exclusionPatterns') ? Optional.present(json[r'exclusionPatterns'] is Iterable
            ? (json[r'exclusionPatterns'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        importPaths: json.containsKey(r'importPaths') ? Optional.present(json[r'importPaths'] is Iterable
            ? (json[r'importPaths'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        name: json.containsKey(r'name') ? Optional.present(mapValueOfType<String>(json, r'name')) : const Optional.absent(),
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
      );
    }
    return null;
  }

  static List<CreateLibraryDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateLibraryDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateLibraryDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateLibraryDto> mapFromJson(dynamic json) {
    final map = <String, CreateLibraryDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateLibraryDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateLibraryDto-objects as value to a dart map
  static Map<String, List<CreateLibraryDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateLibraryDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CreateLibraryDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'ownerId',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateLibraryDto {
  /// Returns a new [CreateLibraryDto] instance.
  CreateLibraryDto({
    this.excludePatterns = const [],
    this.importPaths = const [],
    this.isVisible,
    required this.name,
    required this.type,
  });

  List<String> excludePatterns;

  List<String> importPaths;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isVisible;

  String name;

  LibraryType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateLibraryDto &&
     other.excludePatterns == excludePatterns &&
     other.importPaths == importPaths &&
     other.isVisible == isVisible &&
     other.name == name &&
     other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (excludePatterns.hashCode) +
    (importPaths.hashCode) +
    (isVisible == null ? 0 : isVisible!.hashCode) +
    (name.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'CreateLibraryDto[excludePatterns=$excludePatterns, importPaths=$importPaths, isVisible=$isVisible, name=$name, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'excludePatterns'] = this.excludePatterns;
      json[r'importPaths'] = this.importPaths;
    if (this.isVisible != null) {
      json[r'isVisible'] = this.isVisible;
    } else {
    //  json[r'isVisible'] = null;
    }
      json[r'name'] = this.name;
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [CreateLibraryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateLibraryDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CreateLibraryDto(
        excludePatterns: json[r'excludePatterns'] is List
            ? (json[r'excludePatterns'] as List).cast<String>()
            : const [],
        importPaths: json[r'importPaths'] is List
            ? (json[r'importPaths'] as List).cast<String>()
            : const [],
        isVisible: mapValueOfType<bool>(json, r'isVisible'),
        name: mapValueOfType<String>(json, r'name')!,
        type: LibraryType.fromJson(json[r'type'])!,
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
    'excludePatterns',
    'importPaths',
    'name',
    'type',
  };
}


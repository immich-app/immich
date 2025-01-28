//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateLibraryDto {
  /// Returns a new [UpdateLibraryDto] instance.
  UpdateLibraryDto({
    this.exclusionPatterns = const [],
    this.importPaths = const [],
    this.name,
  });

  List<String> exclusionPatterns;

  List<String> importPaths;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateLibraryDto &&
    _deepEquality.equals(other.exclusionPatterns, exclusionPatterns) &&
    _deepEquality.equals(other.importPaths, importPaths) &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (exclusionPatterns.hashCode) +
    (importPaths.hashCode) +
    (name == null ? 0 : name!.hashCode);

  @override
  String toString() => 'UpdateLibraryDto[exclusionPatterns=$exclusionPatterns, importPaths=$importPaths, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'exclusionPatterns'] = this.exclusionPatterns;
      json[r'importPaths'] = this.importPaths;
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    return json;
  }

  /// Returns a new [UpdateLibraryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateLibraryDto? fromJson(dynamic value) {
    upgradeDto(value, "UpdateLibraryDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UpdateLibraryDto(
        exclusionPatterns: json[r'exclusionPatterns'] is Iterable
            ? (json[r'exclusionPatterns'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        importPaths: json[r'importPaths'] is Iterable
            ? (json[r'importPaths'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        name: mapValueOfType<String>(json, r'name'),
      );
    }
    return null;
  }

  static List<UpdateLibraryDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateLibraryDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateLibraryDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateLibraryDto> mapFromJson(dynamic json) {
    final map = <String, UpdateLibraryDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateLibraryDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateLibraryDto-objects as value to a dart map
  static Map<String, List<UpdateLibraryDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateLibraryDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UpdateLibraryDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


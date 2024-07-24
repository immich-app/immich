//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ValidateLibraryDto {
  /// Returns a new [ValidateLibraryDto] instance.
  ValidateLibraryDto({
    this.exclusionPatterns = const [],
    this.importPaths = const [],
  });

  List<String> exclusionPatterns;

  List<String> importPaths;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ValidateLibraryDto &&
    _deepEquality.equals(other.exclusionPatterns, exclusionPatterns) &&
    _deepEquality.equals(other.importPaths, importPaths);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (exclusionPatterns.hashCode) +
    (importPaths.hashCode);

  @override
  String toString() => 'ValidateLibraryDto[exclusionPatterns=$exclusionPatterns, importPaths=$importPaths]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'exclusionPatterns'] = this.exclusionPatterns;
      json[r'importPaths'] = this.importPaths;
    return json;
  }

  /// Returns a new [ValidateLibraryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ValidateLibraryDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ValidateLibraryDto(
        exclusionPatterns: json[r'exclusionPatterns'] is Iterable
            ? (json[r'exclusionPatterns'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        importPaths: json[r'importPaths'] is Iterable
            ? (json[r'importPaths'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<ValidateLibraryDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ValidateLibraryDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ValidateLibraryDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ValidateLibraryDto> mapFromJson(dynamic json) {
    final map = <String, ValidateLibraryDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ValidateLibraryDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ValidateLibraryDto-objects as value to a dart map
  static Map<String, List<ValidateLibraryDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ValidateLibraryDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ValidateLibraryDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


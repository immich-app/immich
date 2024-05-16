//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ValidateLibraryResponseDto {
  /// Returns a new [ValidateLibraryResponseDto] instance.
  ValidateLibraryResponseDto({
    this.importPaths = const [],
  });

  List<ValidateLibraryImportPathResponseDto> importPaths;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ValidateLibraryResponseDto &&
    _deepEquality.equals(other.importPaths, importPaths);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (importPaths.hashCode);

  @override
  String toString() => 'ValidateLibraryResponseDto[importPaths=$importPaths]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'importPaths'] = this.importPaths;
    return json;
  }

  /// Returns a new [ValidateLibraryResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ValidateLibraryResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ValidateLibraryResponseDto(
        importPaths: ValidateLibraryImportPathResponseDto.listFromJson(json[r'importPaths']),
      );
    }
    return null;
  }

  static List<ValidateLibraryResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ValidateLibraryResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ValidateLibraryResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ValidateLibraryResponseDto> mapFromJson(dynamic json) {
    final map = <String, ValidateLibraryResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ValidateLibraryResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ValidateLibraryResponseDto-objects as value to a dart map
  static Map<String, List<ValidateLibraryResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ValidateLibraryResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ValidateLibraryResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


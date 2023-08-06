//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SetImportPathsDto {
  /// Returns a new [SetImportPathsDto] instance.
  SetImportPathsDto({
    this.importPaths = const [],
  });

  List<String> importPaths;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SetImportPathsDto &&
     other.importPaths == importPaths;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (importPaths.hashCode);

  @override
  String toString() => 'SetImportPathsDto[importPaths=$importPaths]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'importPaths'] = this.importPaths;
    return json;
  }

  /// Returns a new [SetImportPathsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SetImportPathsDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SetImportPathsDto(
        importPaths: json[r'importPaths'] is List
            ? (json[r'importPaths'] as List).cast<String>()
            : const [],
      );
    }
    return null;
  }

  static List<SetImportPathsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SetImportPathsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SetImportPathsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SetImportPathsDto> mapFromJson(dynamic json) {
    final map = <String, SetImportPathsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SetImportPathsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SetImportPathsDto-objects as value to a dart map
  static Map<String, List<SetImportPathsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SetImportPathsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SetImportPathsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'importPaths',
  };
}


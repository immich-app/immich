//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ImmichLibraryDto {
  /// Returns a new [ImmichLibraryDto] instance.
  ImmichLibraryDto({
    this.exclusionPatterns = const [],
    required this.id,
    this.importPaths = const [],
    required this.name,
  });

  List<String> exclusionPatterns;

  String id;

  List<String> importPaths;

  String name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ImmichLibraryDto &&
    _deepEquality.equals(other.exclusionPatterns, exclusionPatterns) &&
    other.id == id &&
    _deepEquality.equals(other.importPaths, importPaths) &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (exclusionPatterns.hashCode) +
    (id.hashCode) +
    (importPaths.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'ImmichLibraryDto[exclusionPatterns=$exclusionPatterns, id=$id, importPaths=$importPaths, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'exclusionPatterns'] = this.exclusionPatterns;
      json[r'id'] = this.id;
      json[r'importPaths'] = this.importPaths;
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [ImmichLibraryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ImmichLibraryDto? fromJson(dynamic value) {
    upgradeDto(value, "ImmichLibraryDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ImmichLibraryDto(
        exclusionPatterns: json[r'exclusionPatterns'] is Iterable
            ? (json[r'exclusionPatterns'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        id: mapValueOfType<String>(json, r'id')!,
        importPaths: json[r'importPaths'] is Iterable
            ? (json[r'importPaths'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        name: mapValueOfType<String>(json, r'name')!,
      );
    }
    return null;
  }

  static List<ImmichLibraryDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ImmichLibraryDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ImmichLibraryDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ImmichLibraryDto> mapFromJson(dynamic json) {
    final map = <String, ImmichLibraryDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ImmichLibraryDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ImmichLibraryDto-objects as value to a dart map
  static Map<String, List<ImmichLibraryDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ImmichLibraryDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ImmichLibraryDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'exclusionPatterns',
    'id',
    'importPaths',
    'name',
  };
}


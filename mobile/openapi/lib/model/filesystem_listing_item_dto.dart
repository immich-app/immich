//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class FilesystemListingItemDto {
  /// Returns a new [FilesystemListingItemDto] instance.
  FilesystemListingItemDto({
    required this.isDirectory,
    required this.path,
  });

  bool isDirectory;

  String path;

  @override
  bool operator ==(Object other) => identical(this, other) || other is FilesystemListingItemDto &&
    other.isDirectory == isDirectory &&
    other.path == path;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (isDirectory.hashCode) +
    (path.hashCode);

  @override
  String toString() => 'FilesystemListingItemDto[isDirectory=$isDirectory, path=$path]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'isDirectory'] = this.isDirectory;
      json[r'path'] = this.path;
    return json;
  }

  /// Returns a new [FilesystemListingItemDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static FilesystemListingItemDto? fromJson(dynamic value) {
    upgradeDto(value, "FilesystemListingItemDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return FilesystemListingItemDto(
        isDirectory: mapValueOfType<bool>(json, r'isDirectory')!,
        path: mapValueOfType<String>(json, r'path')!,
      );
    }
    return null;
  }

  static List<FilesystemListingItemDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <FilesystemListingItemDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = FilesystemListingItemDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, FilesystemListingItemDto> mapFromJson(dynamic json) {
    final map = <String, FilesystemListingItemDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = FilesystemListingItemDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of FilesystemListingItemDto-objects as value to a dart map
  static Map<String, List<FilesystemListingItemDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<FilesystemListingItemDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = FilesystemListingItemDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'isDirectory',
    'path',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class FilesystemListingResponseDto {
  /// Returns a new [FilesystemListingResponseDto] instance.
  FilesystemListingResponseDto({
    this.items = const [],
    required this.parent,
    required this.path,
  });

  List<FilesystemListingItemDto> items;

  String parent;

  String path;

  @override
  bool operator ==(Object other) => identical(this, other) || other is FilesystemListingResponseDto &&
    _deepEquality.equals(other.items, items) &&
    other.parent == parent &&
    other.path == path;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (items.hashCode) +
    (parent.hashCode) +
    (path.hashCode);

  @override
  String toString() => 'FilesystemListingResponseDto[items=$items, parent=$parent, path=$path]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'items'] = this.items;
      json[r'parent'] = this.parent;
      json[r'path'] = this.path;
    return json;
  }

  /// Returns a new [FilesystemListingResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static FilesystemListingResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "FilesystemListingResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return FilesystemListingResponseDto(
        items: FilesystemListingItemDto.listFromJson(json[r'items']),
        parent: mapValueOfType<String>(json, r'parent')!,
        path: mapValueOfType<String>(json, r'path')!,
      );
    }
    return null;
  }

  static List<FilesystemListingResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <FilesystemListingResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = FilesystemListingResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, FilesystemListingResponseDto> mapFromJson(dynamic json) {
    final map = <String, FilesystemListingResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = FilesystemListingResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of FilesystemListingResponseDto-objects as value to a dart map
  static Map<String, List<FilesystemListingResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<FilesystemListingResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = FilesystemListingResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'items',
    'parent',
    'path',
  };
}


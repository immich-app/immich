//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigMetadataDto {
  /// Returns a new [SystemConfigMetadataDto] instance.
  SystemConfigMetadataDto({
    required this.faces,
    required this.tags,
  });

  SystemConfigFacesDto faces;

  SystemConfigTagsDto tags;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigMetadataDto &&
    other.faces == faces &&
    other.tags == tags;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (faces.hashCode) +
    (tags.hashCode);

  @override
  String toString() => 'SystemConfigMetadataDto[faces=$faces, tags=$tags]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'faces'] = this.faces;
      json[r'tags'] = this.tags;
    return json;
  }

  /// Returns a new [SystemConfigMetadataDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigMetadataDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigMetadataDto(
        faces: SystemConfigFacesDto.fromJson(json[r'faces'])!,
        tags: SystemConfigTagsDto.fromJson(json[r'tags'])!,
      );
    }
    return null;
  }

  static List<SystemConfigMetadataDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigMetadataDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigMetadataDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigMetadataDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigMetadataDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigMetadataDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigMetadataDto-objects as value to a dart map
  static Map<String, List<SystemConfigMetadataDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigMetadataDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigMetadataDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'faces',
    'tags',
  };
}


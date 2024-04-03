//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateSubAlbumDto {
  /// Returns a new [CreateSubAlbumDto] instance.
  CreateSubAlbumDto({
    required this.childrenId,
    required this.parentId,
  });

  String childrenId;

  String parentId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateSubAlbumDto &&
    other.childrenId == childrenId &&
    other.parentId == parentId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (childrenId.hashCode) +
    (parentId.hashCode);

  @override
  String toString() => 'CreateSubAlbumDto[childrenId=$childrenId, parentId=$parentId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'childrenId'] = this.childrenId;
      json[r'parentId'] = this.parentId;
    return json;
  }

  /// Returns a new [CreateSubAlbumDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateSubAlbumDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CreateSubAlbumDto(
        childrenId: mapValueOfType<String>(json, r'childrenId')!,
        parentId: mapValueOfType<String>(json, r'parentId')!,
      );
    }
    return null;
  }

  static List<CreateSubAlbumDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateSubAlbumDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateSubAlbumDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateSubAlbumDto> mapFromJson(dynamic json) {
    final map = <String, CreateSubAlbumDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateSubAlbumDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateSubAlbumDto-objects as value to a dart map
  static Map<String, List<CreateSubAlbumDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateSubAlbumDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CreateSubAlbumDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'childrenId',
    'parentId',
  };
}


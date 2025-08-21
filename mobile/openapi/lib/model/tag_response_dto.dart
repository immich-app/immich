//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TagResponseDto {
  /// Returns a new [TagResponseDto] instance.
  TagResponseDto({
    this.color,
    required this.createdAt,
    required this.id,
    required this.name,
    this.parentId,
    required this.updatedAt,
    required this.value,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? color;

  DateTime createdAt;

  String id;

  String name;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? parentId;

  DateTime updatedAt;

  String value;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TagResponseDto &&
    other.color == color &&
    other.createdAt == createdAt &&
    other.id == id &&
    other.name == name &&
    other.parentId == parentId &&
    other.updatedAt == updatedAt &&
    other.value == value;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (color == null ? 0 : color!.hashCode) +
    (createdAt.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (parentId == null ? 0 : parentId!.hashCode) +
    (updatedAt.hashCode) +
    (value.hashCode);

  @override
  String toString() => 'TagResponseDto[color=$color, createdAt=$createdAt, id=$id, name=$name, parentId=$parentId, updatedAt=$updatedAt, value=$value]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.color != null) {
      json[r'color'] = this.color;
    } else {
    //  json[r'color'] = null;
    }
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'id'] = this.id;
      json[r'name'] = this.name;
    if (this.parentId != null) {
      json[r'parentId'] = this.parentId;
    } else {
    //  json[r'parentId'] = null;
    }
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
      json[r'value'] = this.value;
    return json;
  }

  /// Returns a new [TagResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TagResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "TagResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TagResponseDto(
        color: mapValueOfType<String>(json, r'color'),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        parentId: mapValueOfType<String>(json, r'parentId'),
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
        value: mapValueOfType<String>(json, r'value')!,
      );
    }
    return null;
  }

  static List<TagResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TagResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TagResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TagResponseDto> mapFromJson(dynamic json) {
    final map = <String, TagResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TagResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TagResponseDto-objects as value to a dart map
  static Map<String, List<TagResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TagResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TagResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'id',
    'name',
    'updatedAt',
    'value',
  };
}


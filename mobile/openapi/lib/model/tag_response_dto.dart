//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TagResponseDto {
  /// Returns a new [TagResponseDto] instance.
  TagResponseDto({
    required this.type,
    required this.id,
    required this.name,
    required this.userId,
  });

  TagTypeEnum type;

  String id;

  String name;

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TagResponseDto &&
     other.type == type &&
     other.id == id &&
     other.name == name &&
     other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (type.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'TagResponseDto[type=$type, id=$id, name=$name, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'type'] = this.type;
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [TagResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TagResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "TagResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "TagResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return TagResponseDto(
        type: TagTypeEnum.fromJson(json[r'type'])!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        userId: mapValueOfType<String>(json, r'userId')!,
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
    'type',
    'id',
    'name',
    'userId',
  };
}


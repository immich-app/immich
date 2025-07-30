//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GroupAdminResponseDto {
  /// Returns a new [GroupAdminResponseDto] instance.
  GroupAdminResponseDto({
    required this.createdAt,
    required this.description,
    required this.id,
    required this.name,
    required this.updatedAt,
  });

  DateTime createdAt;

  String? description;

  String id;

  String name;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GroupAdminResponseDto &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.id == id &&
    other.name == name &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'GroupAdminResponseDto[createdAt=$createdAt, description=$description, id=$id, name=$name, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [GroupAdminResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GroupAdminResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "GroupAdminResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return GroupAdminResponseDto(
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        description: mapValueOfType<String>(json, r'description'),
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
      );
    }
    return null;
  }

  static List<GroupAdminResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GroupAdminResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GroupAdminResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GroupAdminResponseDto> mapFromJson(dynamic json) {
    final map = <String, GroupAdminResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GroupAdminResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GroupAdminResponseDto-objects as value to a dart map
  static Map<String, List<GroupAdminResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GroupAdminResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GroupAdminResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'description',
    'id',
    'name',
    'updatedAt',
  };
}


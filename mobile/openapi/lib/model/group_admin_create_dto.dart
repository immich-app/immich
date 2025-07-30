//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GroupAdminCreateDto {
  /// Returns a new [GroupAdminCreateDto] instance.
  GroupAdminCreateDto({
    this.description,
    required this.name,
    this.users = const [],
  });

  String? description;

  String name;

  List<GroupUserDto> users;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GroupAdminCreateDto &&
    other.description == description &&
    other.name == name &&
    _deepEquality.equals(other.users, users);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description == null ? 0 : description!.hashCode) +
    (name.hashCode) +
    (users.hashCode);

  @override
  String toString() => 'GroupAdminCreateDto[description=$description, name=$name, users=$users]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
      json[r'name'] = this.name;
      json[r'users'] = this.users;
    return json;
  }

  /// Returns a new [GroupAdminCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GroupAdminCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "GroupAdminCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return GroupAdminCreateDto(
        description: mapValueOfType<String>(json, r'description'),
        name: mapValueOfType<String>(json, r'name')!,
        users: GroupUserDto.listFromJson(json[r'users']),
      );
    }
    return null;
  }

  static List<GroupAdminCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GroupAdminCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GroupAdminCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GroupAdminCreateDto> mapFromJson(dynamic json) {
    final map = <String, GroupAdminCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GroupAdminCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GroupAdminCreateDto-objects as value to a dart map
  static Map<String, List<GroupAdminCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GroupAdminCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GroupAdminCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
  };
}


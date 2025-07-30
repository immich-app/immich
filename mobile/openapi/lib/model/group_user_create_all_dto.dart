//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GroupUserCreateAllDto {
  /// Returns a new [GroupUserCreateAllDto] instance.
  GroupUserCreateAllDto({
    this.users = const [],
  });

  List<GroupUserDto> users;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GroupUserCreateAllDto &&
    _deepEquality.equals(other.users, users);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (users.hashCode);

  @override
  String toString() => 'GroupUserCreateAllDto[users=$users]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'users'] = this.users;
    return json;
  }

  /// Returns a new [GroupUserCreateAllDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GroupUserCreateAllDto? fromJson(dynamic value) {
    upgradeDto(value, "GroupUserCreateAllDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return GroupUserCreateAllDto(
        users: GroupUserDto.listFromJson(json[r'users']),
      );
    }
    return null;
  }

  static List<GroupUserCreateAllDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GroupUserCreateAllDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GroupUserCreateAllDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GroupUserCreateAllDto> mapFromJson(dynamic json) {
    final map = <String, GroupUserCreateAllDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GroupUserCreateAllDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GroupUserCreateAllDto-objects as value to a dart map
  static Map<String, List<GroupUserCreateAllDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GroupUserCreateAllDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GroupUserCreateAllDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'users',
  };
}


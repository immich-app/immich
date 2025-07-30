//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GroupUserDto {
  /// Returns a new [GroupUserDto] instance.
  GroupUserDto({
    required this.userId,
  });

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GroupUserDto &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (userId.hashCode);

  @override
  String toString() => 'GroupUserDto[userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [GroupUserDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GroupUserDto? fromJson(dynamic value) {
    upgradeDto(value, "GroupUserDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return GroupUserDto(
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<GroupUserDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GroupUserDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GroupUserDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GroupUserDto> mapFromJson(dynamic json) {
    final map = <String, GroupUserDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GroupUserDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GroupUserDto-objects as value to a dart map
  static Map<String, List<GroupUserDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GroupUserDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GroupUserDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'userId',
  };
}


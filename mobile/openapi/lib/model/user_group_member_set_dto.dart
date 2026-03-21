//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserGroupMemberSetDto {
  /// Returns a new [UserGroupMemberSetDto] instance.
  UserGroupMemberSetDto({
    this.userIds = const [],
  });

  /// User IDs
  List<String> userIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserGroupMemberSetDto &&
    _deepEquality.equals(other.userIds, userIds);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (userIds.hashCode);

  @override
  String toString() => 'UserGroupMemberSetDto[userIds=$userIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'userIds'] = this.userIds;
    return json;
  }

  /// Returns a new [UserGroupMemberSetDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserGroupMemberSetDto? fromJson(dynamic value) {
    upgradeDto(value, "UserGroupMemberSetDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserGroupMemberSetDto(
        userIds: json[r'userIds'] is Iterable
            ? (json[r'userIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<UserGroupMemberSetDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserGroupMemberSetDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserGroupMemberSetDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserGroupMemberSetDto> mapFromJson(dynamic json) {
    final map = <String, UserGroupMemberSetDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserGroupMemberSetDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserGroupMemberSetDto-objects as value to a dart map
  static Map<String, List<UserGroupMemberSetDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserGroupMemberSetDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserGroupMemberSetDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'userIds',
  };
}


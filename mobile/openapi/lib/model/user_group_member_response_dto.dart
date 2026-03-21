//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserGroupMemberResponseDto {
  /// Returns a new [UserGroupMemberResponseDto] instance.
  UserGroupMemberResponseDto({
    this.avatarColor,
    required this.email,
    required this.name,
    this.profileImagePath,
    required this.userId,
  });

  /// Avatar color
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? avatarColor;

  /// User email
  String email;

  /// User name
  String name;

  /// Profile image path
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? profileImagePath;

  /// User ID
  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserGroupMemberResponseDto &&
    other.avatarColor == avatarColor &&
    other.email == email &&
    other.name == name &&
    other.profileImagePath == profileImagePath &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor == null ? 0 : avatarColor!.hashCode) +
    (email.hashCode) +
    (name.hashCode) +
    (profileImagePath == null ? 0 : profileImagePath!.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'UserGroupMemberResponseDto[avatarColor=$avatarColor, email=$email, name=$name, profileImagePath=$profileImagePath, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.avatarColor != null) {
      json[r'avatarColor'] = this.avatarColor;
    } else {
    //  json[r'avatarColor'] = null;
    }
      json[r'email'] = this.email;
      json[r'name'] = this.name;
    if (this.profileImagePath != null) {
      json[r'profileImagePath'] = this.profileImagePath;
    } else {
    //  json[r'profileImagePath'] = null;
    }
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [UserGroupMemberResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserGroupMemberResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "UserGroupMemberResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserGroupMemberResponseDto(
        avatarColor: mapValueOfType<String>(json, r'avatarColor'),
        email: mapValueOfType<String>(json, r'email')!,
        name: mapValueOfType<String>(json, r'name')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath'),
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<UserGroupMemberResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserGroupMemberResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserGroupMemberResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserGroupMemberResponseDto> mapFromJson(dynamic json) {
    final map = <String, UserGroupMemberResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserGroupMemberResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserGroupMemberResponseDto-objects as value to a dart map
  static Map<String, List<UserGroupMemberResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserGroupMemberResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserGroupMemberResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'email',
    'name',
    'userId',
  };
}


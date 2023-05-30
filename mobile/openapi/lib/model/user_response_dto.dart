//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserResponseDto {
  /// Returns a new [UserResponseDto] instance.
  UserResponseDto({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.storageLabel,
    required this.profileImagePath,
    required this.shouldChangePassword,
    required this.isAdmin,
    required this.createdAt,
    required this.deletedAt,
    required this.updatedAt,
    required this.oauthId,
  });

  String id;

  String email;

  String firstName;

  String lastName;

  String? storageLabel;

  String profileImagePath;

  bool shouldChangePassword;

  bool isAdmin;

  DateTime createdAt;

  DateTime? deletedAt;

  DateTime updatedAt;

  String oauthId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserResponseDto &&
     other.id == id &&
     other.email == email &&
     other.firstName == firstName &&
     other.lastName == lastName &&
     other.storageLabel == storageLabel &&
     other.profileImagePath == profileImagePath &&
     other.shouldChangePassword == shouldChangePassword &&
     other.isAdmin == isAdmin &&
     other.createdAt == createdAt &&
     other.deletedAt == deletedAt &&
     other.updatedAt == updatedAt &&
     other.oauthId == oauthId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (email.hashCode) +
    (firstName.hashCode) +
    (lastName.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode) +
    (profileImagePath.hashCode) +
    (shouldChangePassword.hashCode) +
    (isAdmin.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (updatedAt.hashCode) +
    (oauthId.hashCode);

  @override
  String toString() => 'UserResponseDto[id=$id, email=$email, firstName=$firstName, lastName=$lastName, storageLabel=$storageLabel, profileImagePath=$profileImagePath, shouldChangePassword=$shouldChangePassword, isAdmin=$isAdmin, createdAt=$createdAt, deletedAt=$deletedAt, updatedAt=$updatedAt, oauthId=$oauthId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'email'] = this.email;
      json[r'firstName'] = this.firstName;
      json[r'lastName'] = this.lastName;
    if (this.storageLabel != null) {
      json[r'storageLabel'] = this.storageLabel;
    } else {
      // json[r'storageLabel'] = null;
    }
      json[r'profileImagePath'] = this.profileImagePath;
      json[r'shouldChangePassword'] = this.shouldChangePassword;
      json[r'isAdmin'] = this.isAdmin;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
      // json[r'deletedAt'] = null;
    }
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
      json[r'oauthId'] = this.oauthId;
    return json;
  }

  /// Returns a new [UserResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "UserResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "UserResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return UserResponseDto(
        id: mapValueOfType<String>(json, r'id')!,
        email: mapValueOfType<String>(json, r'email')!,
        firstName: mapValueOfType<String>(json, r'firstName')!,
        lastName: mapValueOfType<String>(json, r'lastName')!,
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        createdAt: mapDateTime(json, r'createdAt', '')!,
        deletedAt: mapDateTime(json, r'deletedAt', ''),
        updatedAt: mapDateTime(json, r'updatedAt', '')!,
        oauthId: mapValueOfType<String>(json, r'oauthId')!,
      );
    }
    return null;
  }

  static List<UserResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserResponseDto> mapFromJson(dynamic json) {
    final map = <String, UserResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserResponseDto-objects as value to a dart map
  static Map<String, List<UserResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'email',
    'firstName',
    'lastName',
    'storageLabel',
    'profileImagePath',
    'shouldChangePassword',
    'isAdmin',
    'createdAt',
    'deletedAt',
    'updatedAt',
    'oauthId',
  };
}


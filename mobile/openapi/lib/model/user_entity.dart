//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserEntity {
  /// Returns a new [UserEntity] instance.
  UserEntity({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.isAdmin,
    required this.email,
    this.password,
    this.salt,
    required this.oauthId,
    required this.profileImagePath,
    required this.shouldChangePassword,
    required this.createdAt,
    this.deletedAt,
    this.tags = const [],
  });

  String id;

  String firstName;

  String lastName;

  bool isAdmin;

  String email;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? password;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? salt;

  String oauthId;

  String profileImagePath;

  bool shouldChangePassword;

  String createdAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? deletedAt;

  List<TagEntity> tags;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserEntity &&
     other.id == id &&
     other.firstName == firstName &&
     other.lastName == lastName &&
     other.isAdmin == isAdmin &&
     other.email == email &&
     other.password == password &&
     other.salt == salt &&
     other.oauthId == oauthId &&
     other.profileImagePath == profileImagePath &&
     other.shouldChangePassword == shouldChangePassword &&
     other.createdAt == createdAt &&
     other.deletedAt == deletedAt &&
     other.tags == tags;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (firstName.hashCode) +
    (lastName.hashCode) +
    (isAdmin.hashCode) +
    (email.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (salt == null ? 0 : salt!.hashCode) +
    (oauthId.hashCode) +
    (profileImagePath.hashCode) +
    (shouldChangePassword.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (tags.hashCode);

  @override
  String toString() => 'UserEntity[id=$id, firstName=$firstName, lastName=$lastName, isAdmin=$isAdmin, email=$email, password=$password, salt=$salt, oauthId=$oauthId, profileImagePath=$profileImagePath, shouldChangePassword=$shouldChangePassword, createdAt=$createdAt, deletedAt=$deletedAt, tags=$tags]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'id'] = id;
      _json[r'firstName'] = firstName;
      _json[r'lastName'] = lastName;
      _json[r'isAdmin'] = isAdmin;
      _json[r'email'] = email;
    if (password != null) {
      _json[r'password'] = password;
    } else {
      _json[r'password'] = null;
    }
    if (salt != null) {
      _json[r'salt'] = salt;
    } else {
      _json[r'salt'] = null;
    }
      _json[r'oauthId'] = oauthId;
      _json[r'profileImagePath'] = profileImagePath;
      _json[r'shouldChangePassword'] = shouldChangePassword;
      _json[r'createdAt'] = createdAt;
    if (deletedAt != null) {
      _json[r'deletedAt'] = deletedAt!.toUtc().toIso8601String();
    } else {
      _json[r'deletedAt'] = null;
    }
      _json[r'tags'] = tags;
    return _json;
  }

  /// Returns a new [UserEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "UserEntity[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "UserEntity[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return UserEntity(
        id: mapValueOfType<String>(json, r'id')!,
        firstName: mapValueOfType<String>(json, r'firstName')!,
        lastName: mapValueOfType<String>(json, r'lastName')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        email: mapValueOfType<String>(json, r'email')!,
        password: mapValueOfType<String>(json, r'password'),
        salt: mapValueOfType<String>(json, r'salt'),
        oauthId: mapValueOfType<String>(json, r'oauthId')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword')!,
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        deletedAt: mapDateTime(json, r'deletedAt', ''),
        tags: TagEntity.listFromJson(json[r'tags'])!,
      );
    }
    return null;
  }

  static List<UserEntity>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserEntity> mapFromJson(dynamic json) {
    final map = <String, UserEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserEntity-objects as value to a dart map
  static Map<String, List<UserEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserEntity>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserEntity.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'firstName',
    'lastName',
    'isAdmin',
    'email',
    'oauthId',
    'profileImagePath',
    'shouldChangePassword',
    'createdAt',
    'tags',
  };
}


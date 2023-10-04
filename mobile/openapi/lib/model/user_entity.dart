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
    this.assets = const [],
    required this.createdAt,
    required this.deletedAt,
    required this.email,
    required this.externalPath,
    required this.firstName,
    required this.id,
    required this.isAdmin,
    required this.lastName,
    required this.memoriesEnabled,
    required this.oauthId,
    this.password,
    required this.profileImagePath,
    required this.shouldChangePassword,
    required this.storageLabel,
    this.tags = const [],
    required this.updatedAt,
  });

  List<AssetEntity> assets;

  DateTime createdAt;

  DateTime? deletedAt;

  String email;

  String? externalPath;

  String firstName;

  String id;

  bool isAdmin;

  String lastName;

  bool memoriesEnabled;

  String oauthId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? password;

  String profileImagePath;

  bool shouldChangePassword;

  String? storageLabel;

  List<TagEntity> tags;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserEntity &&
     other.assets == assets &&
     other.createdAt == createdAt &&
     other.deletedAt == deletedAt &&
     other.email == email &&
     other.externalPath == externalPath &&
     other.firstName == firstName &&
     other.id == id &&
     other.isAdmin == isAdmin &&
     other.lastName == lastName &&
     other.memoriesEnabled == memoriesEnabled &&
     other.oauthId == oauthId &&
     other.password == password &&
     other.profileImagePath == profileImagePath &&
     other.shouldChangePassword == shouldChangePassword &&
     other.storageLabel == storageLabel &&
     other.tags == tags &&
     other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assets.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (email.hashCode) +
    (externalPath == null ? 0 : externalPath!.hashCode) +
    (firstName.hashCode) +
    (id.hashCode) +
    (isAdmin.hashCode) +
    (lastName.hashCode) +
    (memoriesEnabled.hashCode) +
    (oauthId.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (profileImagePath.hashCode) +
    (shouldChangePassword.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode) +
    (tags.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'UserEntity[assets=$assets, createdAt=$createdAt, deletedAt=$deletedAt, email=$email, externalPath=$externalPath, firstName=$firstName, id=$id, isAdmin=$isAdmin, lastName=$lastName, memoriesEnabled=$memoriesEnabled, oauthId=$oauthId, password=$password, profileImagePath=$profileImagePath, shouldChangePassword=$shouldChangePassword, storageLabel=$storageLabel, tags=$tags, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assets'] = this.assets;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'email'] = this.email;
    if (this.externalPath != null) {
      json[r'externalPath'] = this.externalPath;
    } else {
    //  json[r'externalPath'] = null;
    }
      json[r'firstName'] = this.firstName;
      json[r'id'] = this.id;
      json[r'isAdmin'] = this.isAdmin;
      json[r'lastName'] = this.lastName;
      json[r'memoriesEnabled'] = this.memoriesEnabled;
      json[r'oauthId'] = this.oauthId;
    if (this.password != null) {
      json[r'password'] = this.password;
    } else {
    //  json[r'password'] = null;
    }
      json[r'profileImagePath'] = this.profileImagePath;
      json[r'shouldChangePassword'] = this.shouldChangePassword;
    if (this.storageLabel != null) {
      json[r'storageLabel'] = this.storageLabel;
    } else {
    //  json[r'storageLabel'] = null;
    }
      json[r'tags'] = this.tags;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [UserEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserEntity(
        assets: AssetEntity.listFromJson(json[r'assets']),
        createdAt: mapDateTime(json, r'createdAt', '')!,
        deletedAt: mapDateTime(json, r'deletedAt', ''),
        email: mapValueOfType<String>(json, r'email')!,
        externalPath: mapValueOfType<String>(json, r'externalPath'),
        firstName: mapValueOfType<String>(json, r'firstName')!,
        id: mapValueOfType<String>(json, r'id')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        lastName: mapValueOfType<String>(json, r'lastName')!,
        memoriesEnabled: mapValueOfType<bool>(json, r'memoriesEnabled')!,
        oauthId: mapValueOfType<String>(json, r'oauthId')!,
        password: mapValueOfType<String>(json, r'password'),
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword')!,
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
        tags: TagEntity.listFromJson(json[r'tags']),
        updatedAt: mapDateTime(json, r'updatedAt', '')!,
      );
    }
    return null;
  }

  static List<UserEntity> listFromJson(dynamic json, {bool growable = false,}) {
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
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assets',
    'createdAt',
    'deletedAt',
    'email',
    'externalPath',
    'firstName',
    'id',
    'isAdmin',
    'lastName',
    'memoriesEnabled',
    'oauthId',
    'profileImagePath',
    'shouldChangePassword',
    'storageLabel',
    'tags',
    'updatedAt',
  };
}


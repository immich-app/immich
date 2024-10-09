//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserAdminResponseDto {
  /// Returns a new [UserAdminResponseDto] instance.
  UserAdminResponseDto({
    required this.avatarColor,
    required this.createdAt,
    required this.deletedAt,
    required this.email,
    required this.id,
    required this.isAdmin,
    required this.license,
    required this.name,
    required this.oauthId,
    required this.profileChangedAt,
    required this.profileImagePath,
    required this.quotaSizeInBytes,
    required this.quotaUsageInBytes,
    required this.shouldChangePassword,
    required this.status,
    required this.storageLabel,
    required this.updatedAt,
  });

  UserAvatarColor avatarColor;

  DateTime createdAt;

  DateTime? deletedAt;

  String email;

  String id;

  bool isAdmin;

  UserLicense? license;

  String name;

  String oauthId;

  DateTime profileChangedAt;

  String profileImagePath;

  int? quotaSizeInBytes;

  int? quotaUsageInBytes;

  bool shouldChangePassword;

  UserStatus status;

  String? storageLabel;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserAdminResponseDto &&
    other.avatarColor == avatarColor &&
    other.createdAt == createdAt &&
    other.deletedAt == deletedAt &&
    other.email == email &&
    other.id == id &&
    other.isAdmin == isAdmin &&
    other.license == license &&
    other.name == name &&
    other.oauthId == oauthId &&
    other.profileChangedAt == profileChangedAt &&
    other.profileImagePath == profileImagePath &&
    other.quotaSizeInBytes == quotaSizeInBytes &&
    other.quotaUsageInBytes == quotaUsageInBytes &&
    other.shouldChangePassword == shouldChangePassword &&
    other.status == status &&
    other.storageLabel == storageLabel &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (email.hashCode) +
    (id.hashCode) +
    (isAdmin.hashCode) +
    (license == null ? 0 : license!.hashCode) +
    (name.hashCode) +
    (oauthId.hashCode) +
    (profileChangedAt.hashCode) +
    (profileImagePath.hashCode) +
    (quotaSizeInBytes == null ? 0 : quotaSizeInBytes!.hashCode) +
    (quotaUsageInBytes == null ? 0 : quotaUsageInBytes!.hashCode) +
    (shouldChangePassword.hashCode) +
    (status.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'UserAdminResponseDto[avatarColor=$avatarColor, createdAt=$createdAt, deletedAt=$deletedAt, email=$email, id=$id, isAdmin=$isAdmin, license=$license, name=$name, oauthId=$oauthId, profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath, quotaSizeInBytes=$quotaSizeInBytes, quotaUsageInBytes=$quotaUsageInBytes, shouldChangePassword=$shouldChangePassword, status=$status, storageLabel=$storageLabel, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'avatarColor'] = this.avatarColor;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'email'] = this.email;
      json[r'id'] = this.id;
      json[r'isAdmin'] = this.isAdmin;
    if (this.license != null) {
      json[r'license'] = this.license;
    } else {
    //  json[r'license'] = null;
    }
      json[r'name'] = this.name;
      json[r'oauthId'] = this.oauthId;
      json[r'profileChangedAt'] = this.profileChangedAt.toUtc().toIso8601String();
      json[r'profileImagePath'] = this.profileImagePath;
    if (this.quotaSizeInBytes != null) {
      json[r'quotaSizeInBytes'] = this.quotaSizeInBytes;
    } else {
    //  json[r'quotaSizeInBytes'] = null;
    }
    if (this.quotaUsageInBytes != null) {
      json[r'quotaUsageInBytes'] = this.quotaUsageInBytes;
    } else {
    //  json[r'quotaUsageInBytes'] = null;
    }
      json[r'shouldChangePassword'] = this.shouldChangePassword;
      json[r'status'] = this.status;
    if (this.storageLabel != null) {
      json[r'storageLabel'] = this.storageLabel;
    } else {
    //  json[r'storageLabel'] = null;
    }
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [UserAdminResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserAdminResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "UserAdminResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserAdminResponseDto(
        avatarColor: UserAvatarColor.fromJson(json[r'avatarColor'])!,
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        email: mapValueOfType<String>(json, r'email')!,
        id: mapValueOfType<String>(json, r'id')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        license: UserLicense.fromJson(json[r'license']),
        name: mapValueOfType<String>(json, r'name')!,
        oauthId: mapValueOfType<String>(json, r'oauthId')!,
        profileChangedAt: mapDateTime(json, r'profileChangedAt', r'')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        quotaSizeInBytes: mapValueOfType<int>(json, r'quotaSizeInBytes'),
        quotaUsageInBytes: mapValueOfType<int>(json, r'quotaUsageInBytes'),
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword')!,
        status: UserStatus.fromJson(json[r'status'])!,
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
      );
    }
    return null;
  }

  static List<UserAdminResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserAdminResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserAdminResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserAdminResponseDto> mapFromJson(dynamic json) {
    final map = <String, UserAdminResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserAdminResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserAdminResponseDto-objects as value to a dart map
  static Map<String, List<UserAdminResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserAdminResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserAdminResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'avatarColor',
    'createdAt',
    'deletedAt',
    'email',
    'id',
    'isAdmin',
    'license',
    'name',
    'oauthId',
    'profileChangedAt',
    'profileImagePath',
    'quotaSizeInBytes',
    'quotaUsageInBytes',
    'shouldChangePassword',
    'status',
    'storageLabel',
    'updatedAt',
  };
}


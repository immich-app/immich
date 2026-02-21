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

  UserAdminResponseDtoAvatarColorEnum avatarColor;

  /// Creation date
  DateTime createdAt;

  DateTime? deletedAt;

  /// User email
  String email;

  /// User ID
  String id;

  /// Is admin user
  bool isAdmin;

  UserLicense license;

  /// User name
  String name;

  /// OAuth ID
  String oauthId;

  /// Profile change date
  DateTime profileChangedAt;

  /// Profile image path
  String profileImagePath;

  num? quotaSizeInBytes;

  num? quotaUsageInBytes;

  /// Require password change on next login
  bool shouldChangePassword;

  /// User status
  UserAdminResponseDtoStatusEnum status;

  String? storageLabel;

  /// Last update date
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
    (license.hashCode) +
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
      json[r'createdAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.createdAt.millisecondsSinceEpoch
        : this.createdAt.toUtc().toIso8601String();
    if (this.deletedAt != null) {
      json[r'deletedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.deletedAt!.millisecondsSinceEpoch
        : this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'email'] = this.email;
      json[r'id'] = this.id;
      json[r'isAdmin'] = this.isAdmin;
      json[r'license'] = this.license;
      json[r'name'] = this.name;
      json[r'oauthId'] = this.oauthId;
      json[r'profileChangedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.profileChangedAt.millisecondsSinceEpoch
        : this.profileChangedAt.toUtc().toIso8601String();
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
      json[r'updatedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.updatedAt.millisecondsSinceEpoch
        : this.updatedAt.toUtc().toIso8601String();
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
        avatarColor: UserAdminResponseDtoAvatarColorEnum.fromJson(json[r'avatarColor'])!,
        createdAt: mapDateTime(json, r'createdAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        deletedAt: mapDateTime(json, r'deletedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/'),
        email: mapValueOfType<String>(json, r'email')!,
        id: mapValueOfType<String>(json, r'id')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        license: UserLicense.fromJson(json[r'license'])!,
        name: mapValueOfType<String>(json, r'name')!,
        oauthId: mapValueOfType<String>(json, r'oauthId')!,
        profileChangedAt: mapDateTime(json, r'profileChangedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        quotaSizeInBytes: json[r'quotaSizeInBytes'] == null
            ? null
            : num.parse('${json[r'quotaSizeInBytes']}'),
        quotaUsageInBytes: json[r'quotaUsageInBytes'] == null
            ? null
            : num.parse('${json[r'quotaUsageInBytes']}'),
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword')!,
        status: UserAdminResponseDtoStatusEnum.fromJson(json[r'status'])!,
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
        updatedAt: mapDateTime(json, r'updatedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
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


class UserAdminResponseDtoAvatarColorEnum {
  /// Instantiate a new enum with the provided [value].
  const UserAdminResponseDtoAvatarColorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const primary = UserAdminResponseDtoAvatarColorEnum._(r'primary');
  static const pink = UserAdminResponseDtoAvatarColorEnum._(r'pink');
  static const red = UserAdminResponseDtoAvatarColorEnum._(r'red');
  static const yellow = UserAdminResponseDtoAvatarColorEnum._(r'yellow');
  static const blue = UserAdminResponseDtoAvatarColorEnum._(r'blue');
  static const green = UserAdminResponseDtoAvatarColorEnum._(r'green');
  static const purple = UserAdminResponseDtoAvatarColorEnum._(r'purple');
  static const orange = UserAdminResponseDtoAvatarColorEnum._(r'orange');
  static const gray = UserAdminResponseDtoAvatarColorEnum._(r'gray');
  static const amber = UserAdminResponseDtoAvatarColorEnum._(r'amber');

  /// List of all possible values in this [enum][UserAdminResponseDtoAvatarColorEnum].
  static const values = <UserAdminResponseDtoAvatarColorEnum>[
    primary,
    pink,
    red,
    yellow,
    blue,
    green,
    purple,
    orange,
    gray,
    amber,
  ];

  static UserAdminResponseDtoAvatarColorEnum? fromJson(dynamic value) => UserAdminResponseDtoAvatarColorEnumTypeTransformer().decode(value);

  static List<UserAdminResponseDtoAvatarColorEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserAdminResponseDtoAvatarColorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserAdminResponseDtoAvatarColorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UserAdminResponseDtoAvatarColorEnum] to String,
/// and [decode] dynamic data back to [UserAdminResponseDtoAvatarColorEnum].
class UserAdminResponseDtoAvatarColorEnumTypeTransformer {
  factory UserAdminResponseDtoAvatarColorEnumTypeTransformer() => _instance ??= const UserAdminResponseDtoAvatarColorEnumTypeTransformer._();

  const UserAdminResponseDtoAvatarColorEnumTypeTransformer._();

  String encode(UserAdminResponseDtoAvatarColorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a UserAdminResponseDtoAvatarColorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserAdminResponseDtoAvatarColorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'primary': return UserAdminResponseDtoAvatarColorEnum.primary;
        case r'pink': return UserAdminResponseDtoAvatarColorEnum.pink;
        case r'red': return UserAdminResponseDtoAvatarColorEnum.red;
        case r'yellow': return UserAdminResponseDtoAvatarColorEnum.yellow;
        case r'blue': return UserAdminResponseDtoAvatarColorEnum.blue;
        case r'green': return UserAdminResponseDtoAvatarColorEnum.green;
        case r'purple': return UserAdminResponseDtoAvatarColorEnum.purple;
        case r'orange': return UserAdminResponseDtoAvatarColorEnum.orange;
        case r'gray': return UserAdminResponseDtoAvatarColorEnum.gray;
        case r'amber': return UserAdminResponseDtoAvatarColorEnum.amber;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [UserAdminResponseDtoAvatarColorEnumTypeTransformer] instance.
  static UserAdminResponseDtoAvatarColorEnumTypeTransformer? _instance;
}


/// User status
class UserAdminResponseDtoStatusEnum {
  /// Instantiate a new enum with the provided [value].
  const UserAdminResponseDtoStatusEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const active = UserAdminResponseDtoStatusEnum._(r'active');
  static const removing = UserAdminResponseDtoStatusEnum._(r'removing');
  static const deleted = UserAdminResponseDtoStatusEnum._(r'deleted');

  /// List of all possible values in this [enum][UserAdminResponseDtoStatusEnum].
  static const values = <UserAdminResponseDtoStatusEnum>[
    active,
    removing,
    deleted,
  ];

  static UserAdminResponseDtoStatusEnum? fromJson(dynamic value) => UserAdminResponseDtoStatusEnumTypeTransformer().decode(value);

  static List<UserAdminResponseDtoStatusEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserAdminResponseDtoStatusEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserAdminResponseDtoStatusEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UserAdminResponseDtoStatusEnum] to String,
/// and [decode] dynamic data back to [UserAdminResponseDtoStatusEnum].
class UserAdminResponseDtoStatusEnumTypeTransformer {
  factory UserAdminResponseDtoStatusEnumTypeTransformer() => _instance ??= const UserAdminResponseDtoStatusEnumTypeTransformer._();

  const UserAdminResponseDtoStatusEnumTypeTransformer._();

  String encode(UserAdminResponseDtoStatusEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a UserAdminResponseDtoStatusEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserAdminResponseDtoStatusEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'active': return UserAdminResponseDtoStatusEnum.active;
        case r'removing': return UserAdminResponseDtoStatusEnum.removing;
        case r'deleted': return UserAdminResponseDtoStatusEnum.deleted;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [UserAdminResponseDtoStatusEnumTypeTransformer] instance.
  static UserAdminResponseDtoStatusEnumTypeTransformer? _instance;
}



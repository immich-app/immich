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
    required this.avatarColor,
    required this.createdAt,
    required this.deletedAt,
    required this.email,
    required this.externalPath,
    required this.firstName,
    required this.id,
    required this.isAdmin,
    required this.lastName,
    this.memoriesEnabled,
    required this.oauthId,
    required this.profileImagePath,
    required this.shouldChangePassword,
    required this.storageLabel,
    required this.updatedAt,
  });

  UserResponseDtoAvatarColorEnum avatarColor;

  DateTime createdAt;

  DateTime? deletedAt;

  String email;

  String? externalPath;

  String firstName;

  String id;

  bool isAdmin;

  String lastName;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? memoriesEnabled;

  String oauthId;

  String profileImagePath;

  bool shouldChangePassword;

  String? storageLabel;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserResponseDto &&
     other.avatarColor == avatarColor &&
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
     other.profileImagePath == profileImagePath &&
     other.shouldChangePassword == shouldChangePassword &&
     other.storageLabel == storageLabel &&
     other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (email.hashCode) +
    (externalPath == null ? 0 : externalPath!.hashCode) +
    (firstName.hashCode) +
    (id.hashCode) +
    (isAdmin.hashCode) +
    (lastName.hashCode) +
    (memoriesEnabled == null ? 0 : memoriesEnabled!.hashCode) +
    (oauthId.hashCode) +
    (profileImagePath.hashCode) +
    (shouldChangePassword.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'UserResponseDto[avatarColor=$avatarColor, createdAt=$createdAt, deletedAt=$deletedAt, email=$email, externalPath=$externalPath, firstName=$firstName, id=$id, isAdmin=$isAdmin, lastName=$lastName, memoriesEnabled=$memoriesEnabled, oauthId=$oauthId, profileImagePath=$profileImagePath, shouldChangePassword=$shouldChangePassword, storageLabel=$storageLabel, updatedAt=$updatedAt]';

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
    if (this.externalPath != null) {
      json[r'externalPath'] = this.externalPath;
    } else {
    //  json[r'externalPath'] = null;
    }
      json[r'firstName'] = this.firstName;
      json[r'id'] = this.id;
      json[r'isAdmin'] = this.isAdmin;
      json[r'lastName'] = this.lastName;
    if (this.memoriesEnabled != null) {
      json[r'memoriesEnabled'] = this.memoriesEnabled;
    } else {
    //  json[r'memoriesEnabled'] = null;
    }
      json[r'oauthId'] = this.oauthId;
      json[r'profileImagePath'] = this.profileImagePath;
      json[r'shouldChangePassword'] = this.shouldChangePassword;
    if (this.storageLabel != null) {
      json[r'storageLabel'] = this.storageLabel;
    } else {
    //  json[r'storageLabel'] = null;
    }
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [UserResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserResponseDto(
        avatarColor: UserResponseDtoAvatarColorEnum.fromJson(json[r'avatarColor'])!,
        createdAt: mapDateTime(json, r'createdAt', '')!,
        deletedAt: mapDateTime(json, r'deletedAt', ''),
        email: mapValueOfType<String>(json, r'email')!,
        externalPath: mapValueOfType<String>(json, r'externalPath'),
        firstName: mapValueOfType<String>(json, r'firstName')!,
        id: mapValueOfType<String>(json, r'id')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        lastName: mapValueOfType<String>(json, r'lastName')!,
        memoriesEnabled: mapValueOfType<bool>(json, r'memoriesEnabled'),
        oauthId: mapValueOfType<String>(json, r'oauthId')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword')!,
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
        updatedAt: mapDateTime(json, r'updatedAt', '')!,
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
    'avatarColor',
    'createdAt',
    'deletedAt',
    'email',
    'externalPath',
    'firstName',
    'id',
    'isAdmin',
    'lastName',
    'oauthId',
    'profileImagePath',
    'shouldChangePassword',
    'storageLabel',
    'updatedAt',
  };
}


class UserResponseDtoAvatarColorEnum {
  /// Instantiate a new enum with the provided [value].
  const UserResponseDtoAvatarColorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const primary = UserResponseDtoAvatarColorEnum._(r'primary');
  static const pink = UserResponseDtoAvatarColorEnum._(r'pink');
  static const red = UserResponseDtoAvatarColorEnum._(r'red');
  static const yellow = UserResponseDtoAvatarColorEnum._(r'yellow');
  static const blue = UserResponseDtoAvatarColorEnum._(r'blue');
  static const green = UserResponseDtoAvatarColorEnum._(r'green');
  static const purple = UserResponseDtoAvatarColorEnum._(r'purple');
  static const orange = UserResponseDtoAvatarColorEnum._(r'orange');
  static const gray = UserResponseDtoAvatarColorEnum._(r'gray');
  static const amber = UserResponseDtoAvatarColorEnum._(r'amber');

  /// List of all possible values in this [enum][UserResponseDtoAvatarColorEnum].
  static const values = <UserResponseDtoAvatarColorEnum>[
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

  static UserResponseDtoAvatarColorEnum? fromJson(dynamic value) => UserResponseDtoAvatarColorEnumTypeTransformer().decode(value);

  static List<UserResponseDtoAvatarColorEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserResponseDtoAvatarColorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserResponseDtoAvatarColorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UserResponseDtoAvatarColorEnum] to String,
/// and [decode] dynamic data back to [UserResponseDtoAvatarColorEnum].
class UserResponseDtoAvatarColorEnumTypeTransformer {
  factory UserResponseDtoAvatarColorEnumTypeTransformer() => _instance ??= const UserResponseDtoAvatarColorEnumTypeTransformer._();

  const UserResponseDtoAvatarColorEnumTypeTransformer._();

  String encode(UserResponseDtoAvatarColorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a UserResponseDtoAvatarColorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserResponseDtoAvatarColorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'primary': return UserResponseDtoAvatarColorEnum.primary;
        case r'pink': return UserResponseDtoAvatarColorEnum.pink;
        case r'red': return UserResponseDtoAvatarColorEnum.red;
        case r'yellow': return UserResponseDtoAvatarColorEnum.yellow;
        case r'blue': return UserResponseDtoAvatarColorEnum.blue;
        case r'green': return UserResponseDtoAvatarColorEnum.green;
        case r'purple': return UserResponseDtoAvatarColorEnum.purple;
        case r'orange': return UserResponseDtoAvatarColorEnum.orange;
        case r'gray': return UserResponseDtoAvatarColorEnum.gray;
        case r'amber': return UserResponseDtoAvatarColorEnum.amber;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [UserResponseDtoAvatarColorEnumTypeTransformer] instance.
  static UserResponseDtoAvatarColorEnumTypeTransformer? _instance;
}



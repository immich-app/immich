//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateUserDto {
  /// Returns a new [UpdateUserDto] instance.
  UpdateUserDto({
    this.avatarColor,
    this.email,
    this.externalPath,
    this.firstName,
    required this.id,
    this.isAdmin,
    this.lastName,
    this.memoriesEnabled,
    this.password,
    this.profileImagePath,
    this.shouldChangePassword,
    this.storageLabel,
  });

  UpdateUserDtoAvatarColorEnum? avatarColor;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? email;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? externalPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? firstName;

  String id;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isAdmin;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? lastName;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? memoriesEnabled;

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
  String? profileImagePath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? shouldChangePassword;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? storageLabel;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateUserDto &&
     other.avatarColor == avatarColor &&
     other.email == email &&
     other.externalPath == externalPath &&
     other.firstName == firstName &&
     other.id == id &&
     other.isAdmin == isAdmin &&
     other.lastName == lastName &&
     other.memoriesEnabled == memoriesEnabled &&
     other.password == password &&
     other.profileImagePath == profileImagePath &&
     other.shouldChangePassword == shouldChangePassword &&
     other.storageLabel == storageLabel;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor == null ? 0 : avatarColor!.hashCode) +
    (email == null ? 0 : email!.hashCode) +
    (externalPath == null ? 0 : externalPath!.hashCode) +
    (firstName == null ? 0 : firstName!.hashCode) +
    (id.hashCode) +
    (isAdmin == null ? 0 : isAdmin!.hashCode) +
    (lastName == null ? 0 : lastName!.hashCode) +
    (memoriesEnabled == null ? 0 : memoriesEnabled!.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (profileImagePath == null ? 0 : profileImagePath!.hashCode) +
    (shouldChangePassword == null ? 0 : shouldChangePassword!.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode);

  @override
  String toString() => 'UpdateUserDto[avatarColor=$avatarColor, email=$email, externalPath=$externalPath, firstName=$firstName, id=$id, isAdmin=$isAdmin, lastName=$lastName, memoriesEnabled=$memoriesEnabled, password=$password, profileImagePath=$profileImagePath, shouldChangePassword=$shouldChangePassword, storageLabel=$storageLabel]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.avatarColor != null) {
      json[r'avatarColor'] = this.avatarColor;
    } else {
    //  json[r'avatarColor'] = null;
    }
    if (this.email != null) {
      json[r'email'] = this.email;
    } else {
    //  json[r'email'] = null;
    }
    if (this.externalPath != null) {
      json[r'externalPath'] = this.externalPath;
    } else {
    //  json[r'externalPath'] = null;
    }
    if (this.firstName != null) {
      json[r'firstName'] = this.firstName;
    } else {
    //  json[r'firstName'] = null;
    }
      json[r'id'] = this.id;
    if (this.isAdmin != null) {
      json[r'isAdmin'] = this.isAdmin;
    } else {
    //  json[r'isAdmin'] = null;
    }
    if (this.lastName != null) {
      json[r'lastName'] = this.lastName;
    } else {
    //  json[r'lastName'] = null;
    }
    if (this.memoriesEnabled != null) {
      json[r'memoriesEnabled'] = this.memoriesEnabled;
    } else {
    //  json[r'memoriesEnabled'] = null;
    }
    if (this.password != null) {
      json[r'password'] = this.password;
    } else {
    //  json[r'password'] = null;
    }
    if (this.profileImagePath != null) {
      json[r'profileImagePath'] = this.profileImagePath;
    } else {
    //  json[r'profileImagePath'] = null;
    }
    if (this.shouldChangePassword != null) {
      json[r'shouldChangePassword'] = this.shouldChangePassword;
    } else {
    //  json[r'shouldChangePassword'] = null;
    }
    if (this.storageLabel != null) {
      json[r'storageLabel'] = this.storageLabel;
    } else {
    //  json[r'storageLabel'] = null;
    }
    return json;
  }

  /// Returns a new [UpdateUserDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateUserDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UpdateUserDto(
        avatarColor: UpdateUserDtoAvatarColorEnum.fromJson(json[r'avatarColor']),
        email: mapValueOfType<String>(json, r'email'),
        externalPath: mapValueOfType<String>(json, r'externalPath'),
        firstName: mapValueOfType<String>(json, r'firstName'),
        id: mapValueOfType<String>(json, r'id')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin'),
        lastName: mapValueOfType<String>(json, r'lastName'),
        memoriesEnabled: mapValueOfType<bool>(json, r'memoriesEnabled'),
        password: mapValueOfType<String>(json, r'password'),
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath'),
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword'),
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
      );
    }
    return null;
  }

  static List<UpdateUserDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateUserDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateUserDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateUserDto> mapFromJson(dynamic json) {
    final map = <String, UpdateUserDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateUserDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateUserDto-objects as value to a dart map
  static Map<String, List<UpdateUserDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateUserDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UpdateUserDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
  };
}


class UpdateUserDtoAvatarColorEnum {
  /// Instantiate a new enum with the provided [value].
  const UpdateUserDtoAvatarColorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const primary = UpdateUserDtoAvatarColorEnum._(r'primary');
  static const pink = UpdateUserDtoAvatarColorEnum._(r'pink');
  static const red = UpdateUserDtoAvatarColorEnum._(r'red');
  static const yellow = UpdateUserDtoAvatarColorEnum._(r'yellow');
  static const blue = UpdateUserDtoAvatarColorEnum._(r'blue');
  static const green = UpdateUserDtoAvatarColorEnum._(r'green');
  static const purple = UpdateUserDtoAvatarColorEnum._(r'purple');
  static const orange = UpdateUserDtoAvatarColorEnum._(r'orange');
  static const gray = UpdateUserDtoAvatarColorEnum._(r'gray');
  static const amber = UpdateUserDtoAvatarColorEnum._(r'amber');

  /// List of all possible values in this [enum][UpdateUserDtoAvatarColorEnum].
  static const values = <UpdateUserDtoAvatarColorEnum>[
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

  static UpdateUserDtoAvatarColorEnum? fromJson(dynamic value) => UpdateUserDtoAvatarColorEnumTypeTransformer().decode(value);

  static List<UpdateUserDtoAvatarColorEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateUserDtoAvatarColorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateUserDtoAvatarColorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UpdateUserDtoAvatarColorEnum] to String,
/// and [decode] dynamic data back to [UpdateUserDtoAvatarColorEnum].
class UpdateUserDtoAvatarColorEnumTypeTransformer {
  factory UpdateUserDtoAvatarColorEnumTypeTransformer() => _instance ??= const UpdateUserDtoAvatarColorEnumTypeTransformer._();

  const UpdateUserDtoAvatarColorEnumTypeTransformer._();

  String encode(UpdateUserDtoAvatarColorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a UpdateUserDtoAvatarColorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UpdateUserDtoAvatarColorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'primary': return UpdateUserDtoAvatarColorEnum.primary;
        case r'pink': return UpdateUserDtoAvatarColorEnum.pink;
        case r'red': return UpdateUserDtoAvatarColorEnum.red;
        case r'yellow': return UpdateUserDtoAvatarColorEnum.yellow;
        case r'blue': return UpdateUserDtoAvatarColorEnum.blue;
        case r'green': return UpdateUserDtoAvatarColorEnum.green;
        case r'purple': return UpdateUserDtoAvatarColorEnum.purple;
        case r'orange': return UpdateUserDtoAvatarColorEnum.orange;
        case r'gray': return UpdateUserDtoAvatarColorEnum.gray;
        case r'amber': return UpdateUserDtoAvatarColorEnum.amber;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [UpdateUserDtoAvatarColorEnumTypeTransformer] instance.
  static UpdateUserDtoAvatarColorEnumTypeTransformer? _instance;
}



//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserAdminUpdateDto {
  /// Returns a new [UserAdminUpdateDto] instance.
  UserAdminUpdateDto({
    this.avatarColor = const Optional.absent(),
    this.email = const Optional.absent(),
    this.isAdmin = const Optional.absent(),
    this.name = const Optional.absent(),
    this.password = const Optional.absent(),
    this.pinCode = const Optional.absent(),
    this.quotaSizeInBytes = const Optional.absent(),
    this.shouldChangePassword = const Optional.absent(),
    this.storageLabel = const Optional.absent(),
  });

  Optional<UserAvatarColor?> avatarColor;

  /// User email
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> email;

  /// Grant admin privileges
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> isAdmin;

  /// User name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> name;

  /// User password
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> password;

  /// PIN code
  Optional<String?> pinCode;

  /// Storage quota in bytes
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  Optional<int?> quotaSizeInBytes;

  /// Require password change on next login
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> shouldChangePassword;

  /// Storage label
  Optional<String?> storageLabel;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserAdminUpdateDto &&
    other.avatarColor == avatarColor &&
    other.email == email &&
    other.isAdmin == isAdmin &&
    other.name == name &&
    other.password == password &&
    other.pinCode == pinCode &&
    other.quotaSizeInBytes == quotaSizeInBytes &&
    other.shouldChangePassword == shouldChangePassword &&
    other.storageLabel == storageLabel;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor == null ? 0 : avatarColor!.hashCode) +
    (email == null ? 0 : email!.hashCode) +
    (isAdmin == null ? 0 : isAdmin!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (pinCode == null ? 0 : pinCode!.hashCode) +
    (quotaSizeInBytes == null ? 0 : quotaSizeInBytes!.hashCode) +
    (shouldChangePassword == null ? 0 : shouldChangePassword!.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode);

  @override
  String toString() => 'UserAdminUpdateDto[avatarColor=$avatarColor, email=$email, isAdmin=$isAdmin, name=$name, password=$password, pinCode=$pinCode, quotaSizeInBytes=$quotaSizeInBytes, shouldChangePassword=$shouldChangePassword, storageLabel=$storageLabel]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.avatarColor.isPresent) {
      final value = this.avatarColor.value;
      json[r'avatarColor'] = value;
    }
    if (this.email.isPresent) {
      final value = this.email.value;
      json[r'email'] = value;
    }
    if (this.isAdmin.isPresent) {
      final value = this.isAdmin.value;
      json[r'isAdmin'] = value;
    }
    if (this.name.isPresent) {
      final value = this.name.value;
      json[r'name'] = value;
    }
    if (this.password.isPresent) {
      final value = this.password.value;
      json[r'password'] = value;
    }
    if (this.pinCode.isPresent) {
      final value = this.pinCode.value;
      json[r'pinCode'] = value;
    }
    if (this.quotaSizeInBytes.isPresent) {
      final value = this.quotaSizeInBytes.value;
      json[r'quotaSizeInBytes'] = value;
    }
    if (this.shouldChangePassword.isPresent) {
      final value = this.shouldChangePassword.value;
      json[r'shouldChangePassword'] = value;
    }
    if (this.storageLabel.isPresent) {
      final value = this.storageLabel.value;
      json[r'storageLabel'] = value;
    }
    return json;
  }

  /// Returns a new [UserAdminUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserAdminUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "UserAdminUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserAdminUpdateDto(
        avatarColor: json.containsKey(r'avatarColor') ? Optional.present(UserAvatarColor.fromJson(json[r'avatarColor'])) : const Optional.absent(),
        email: json.containsKey(r'email') ? Optional.present(mapValueOfType<String>(json, r'email')) : const Optional.absent(),
        isAdmin: json.containsKey(r'isAdmin') ? Optional.present(mapValueOfType<bool>(json, r'isAdmin')) : const Optional.absent(),
        name: json.containsKey(r'name') ? Optional.present(mapValueOfType<String>(json, r'name')) : const Optional.absent(),
        password: json.containsKey(r'password') ? Optional.present(mapValueOfType<String>(json, r'password')) : const Optional.absent(),
        pinCode: json.containsKey(r'pinCode') ? Optional.present(mapValueOfType<String>(json, r'pinCode')) : const Optional.absent(),
        quotaSizeInBytes: json.containsKey(r'quotaSizeInBytes') ? Optional.present(json[r'quotaSizeInBytes'] == null ? null : int.parse('${json[r'quotaSizeInBytes']}')) : const Optional.absent(),
        shouldChangePassword: json.containsKey(r'shouldChangePassword') ? Optional.present(mapValueOfType<bool>(json, r'shouldChangePassword')) : const Optional.absent(),
        storageLabel: json.containsKey(r'storageLabel') ? Optional.present(mapValueOfType<String>(json, r'storageLabel')) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<UserAdminUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserAdminUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserAdminUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserAdminUpdateDto> mapFromJson(dynamic json) {
    final map = <String, UserAdminUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserAdminUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserAdminUpdateDto-objects as value to a dart map
  static Map<String, List<UserAdminUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserAdminUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserAdminUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


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
    this.email,
    this.name,
    this.password,
    this.quotaSizeInBytes,
    this.shouldChangePassword,
    this.storageLabel,
  });

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
  String? name;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? password;

  /// Minimum value: 1
  int? quotaSizeInBytes;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? shouldChangePassword;

  String? storageLabel;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserAdminUpdateDto &&
    other.email == email &&
    other.name == name &&
    other.password == password &&
    other.quotaSizeInBytes == quotaSizeInBytes &&
    other.shouldChangePassword == shouldChangePassword &&
    other.storageLabel == storageLabel;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (email == null ? 0 : email!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (quotaSizeInBytes == null ? 0 : quotaSizeInBytes!.hashCode) +
    (shouldChangePassword == null ? 0 : shouldChangePassword!.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode);

  @override
  String toString() => 'UserAdminUpdateDto[email=$email, name=$name, password=$password, quotaSizeInBytes=$quotaSizeInBytes, shouldChangePassword=$shouldChangePassword, storageLabel=$storageLabel]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.email != null) {
      json[r'email'] = this.email;
    } else {
    //  json[r'email'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    if (this.password != null) {
      json[r'password'] = this.password;
    } else {
    //  json[r'password'] = null;
    }
    if (this.quotaSizeInBytes != null) {
      json[r'quotaSizeInBytes'] = this.quotaSizeInBytes;
    } else {
    //  json[r'quotaSizeInBytes'] = null;
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

  /// Returns a new [UserAdminUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserAdminUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "UserAdminUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserAdminUpdateDto(
        email: mapValueOfType<String>(json, r'email'),
        name: mapValueOfType<String>(json, r'name'),
        password: mapValueOfType<String>(json, r'password'),
        quotaSizeInBytes: mapValueOfType<int>(json, r'quotaSizeInBytes'),
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword'),
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
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


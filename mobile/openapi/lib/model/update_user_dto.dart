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
    required this.id,
    this.email,
    this.password,
    this.firstName,
    this.lastName,
    this.isAdmin,
    this.shouldChangePassword,
    this.profileImagePath,
  });

  String id;

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
  String? password;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? firstName;

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
  bool? isAdmin;

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
  String? profileImagePath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateUserDto &&
     other.id == id &&
     other.email == email &&
     other.password == password &&
     other.firstName == firstName &&
     other.lastName == lastName &&
     other.isAdmin == isAdmin &&
     other.shouldChangePassword == shouldChangePassword &&
     other.profileImagePath == profileImagePath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (email == null ? 0 : email!.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (firstName == null ? 0 : firstName!.hashCode) +
    (lastName == null ? 0 : lastName!.hashCode) +
    (isAdmin == null ? 0 : isAdmin!.hashCode) +
    (shouldChangePassword == null ? 0 : shouldChangePassword!.hashCode) +
    (profileImagePath == null ? 0 : profileImagePath!.hashCode);

  @override
  String toString() => 'UpdateUserDto[id=$id, email=$email, password=$password, firstName=$firstName, lastName=$lastName, isAdmin=$isAdmin, shouldChangePassword=$shouldChangePassword, profileImagePath=$profileImagePath]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'id'] = id;
    if (email != null) {
      _json[r'email'] = email;
    } else {
      _json[r'email'] = null;
    }
    if (password != null) {
      _json[r'password'] = password;
    } else {
      _json[r'password'] = null;
    }
    if (firstName != null) {
      _json[r'firstName'] = firstName;
    } else {
      _json[r'firstName'] = null;
    }
    if (lastName != null) {
      _json[r'lastName'] = lastName;
    } else {
      _json[r'lastName'] = null;
    }
    if (isAdmin != null) {
      _json[r'isAdmin'] = isAdmin;
    } else {
      _json[r'isAdmin'] = null;
    }
    if (shouldChangePassword != null) {
      _json[r'shouldChangePassword'] = shouldChangePassword;
    } else {
      _json[r'shouldChangePassword'] = null;
    }
    if (profileImagePath != null) {
      _json[r'profileImagePath'] = profileImagePath;
    } else {
      _json[r'profileImagePath'] = null;
    }
    return _json;
  }

  /// Returns a new [UpdateUserDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateUserDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "UpdateUserDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "UpdateUserDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return UpdateUserDto(
        id: mapValueOfType<String>(json, r'id')!,
        email: mapValueOfType<String>(json, r'email'),
        password: mapValueOfType<String>(json, r'password'),
        firstName: mapValueOfType<String>(json, r'firstName'),
        lastName: mapValueOfType<String>(json, r'lastName'),
        isAdmin: mapValueOfType<bool>(json, r'isAdmin'),
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword'),
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath'),
      );
    }
    return null;
  }

  static List<UpdateUserDto>? listFromJson(dynamic json, {bool growable = false,}) {
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
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateUserDto.listFromJson(entry.value, growable: growable,);
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
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LoginResponseDto {
  /// Returns a new [LoginResponseDto] instance.
  LoginResponseDto({
    required this.accessToken,
    required this.userId,
    required this.userEmail,
    required this.firstName,
    required this.lastName,
    required this.profileImagePath,
    required this.isAdmin,
    required this.shouldChangePassword,
  });

  String accessToken;

  String userId;

  String userEmail;

  String firstName;

  String lastName;

  String profileImagePath;

  bool isAdmin;

  bool shouldChangePassword;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LoginResponseDto &&
     other.accessToken == accessToken &&
     other.userId == userId &&
     other.userEmail == userEmail &&
     other.firstName == firstName &&
     other.lastName == lastName &&
     other.profileImagePath == profileImagePath &&
     other.isAdmin == isAdmin &&
     other.shouldChangePassword == shouldChangePassword;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (accessToken.hashCode) +
    (userId.hashCode) +
    (userEmail.hashCode) +
    (firstName.hashCode) +
    (lastName.hashCode) +
    (profileImagePath.hashCode) +
    (isAdmin.hashCode) +
    (shouldChangePassword.hashCode);

  @override
  String toString() => 'LoginResponseDto[accessToken=$accessToken, userId=$userId, userEmail=$userEmail, firstName=$firstName, lastName=$lastName, profileImagePath=$profileImagePath, isAdmin=$isAdmin, shouldChangePassword=$shouldChangePassword]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'accessToken'] = this.accessToken;
      json[r'userId'] = this.userId;
      json[r'userEmail'] = this.userEmail;
      json[r'firstName'] = this.firstName;
      json[r'lastName'] = this.lastName;
      json[r'profileImagePath'] = this.profileImagePath;
      json[r'isAdmin'] = this.isAdmin;
      json[r'shouldChangePassword'] = this.shouldChangePassword;
    return json;
  }

  /// Returns a new [LoginResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LoginResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "LoginResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "LoginResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return LoginResponseDto(
        accessToken: mapValueOfType<String>(json, r'accessToken')!,
        userId: mapValueOfType<String>(json, r'userId')!,
        userEmail: mapValueOfType<String>(json, r'userEmail')!,
        firstName: mapValueOfType<String>(json, r'firstName')!,
        lastName: mapValueOfType<String>(json, r'lastName')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword')!,
      );
    }
    return null;
  }

  static List<LoginResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LoginResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LoginResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LoginResponseDto> mapFromJson(dynamic json) {
    final map = <String, LoginResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LoginResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LoginResponseDto-objects as value to a dart map
  static Map<String, List<LoginResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LoginResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LoginResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'accessToken',
    'userId',
    'userEmail',
    'firstName',
    'lastName',
    'profileImagePath',
    'isAdmin',
    'shouldChangePassword',
  };
}


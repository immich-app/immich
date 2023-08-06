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
    required this.firstName,
    required this.isAdmin,
    required this.lastName,
    required this.profileImagePath,
    required this.shouldChangePassword,
    required this.userEmail,
    required this.userId,
  });

  String accessToken;

  String firstName;

  bool isAdmin;

  String lastName;

  String profileImagePath;

  bool shouldChangePassword;

  String userEmail;

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LoginResponseDto &&
    other.accessToken == accessToken &&
    other.firstName == firstName &&
    other.isAdmin == isAdmin &&
    other.lastName == lastName &&
    other.profileImagePath == profileImagePath &&
    other.shouldChangePassword == shouldChangePassword &&
    other.userEmail == userEmail &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (accessToken.hashCode) +
    (firstName.hashCode) +
    (isAdmin.hashCode) +
    (lastName.hashCode) +
    (profileImagePath.hashCode) +
    (shouldChangePassword.hashCode) +
    (userEmail.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'LoginResponseDto[accessToken=$accessToken, firstName=$firstName, isAdmin=$isAdmin, lastName=$lastName, profileImagePath=$profileImagePath, shouldChangePassword=$shouldChangePassword, userEmail=$userEmail, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'accessToken'] = this.accessToken;
      json[r'firstName'] = this.firstName;
      json[r'isAdmin'] = this.isAdmin;
      json[r'lastName'] = this.lastName;
      json[r'profileImagePath'] = this.profileImagePath;
      json[r'shouldChangePassword'] = this.shouldChangePassword;
      json[r'userEmail'] = this.userEmail;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [LoginResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LoginResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return LoginResponseDto(
        accessToken: mapValueOfType<String>(json, r'accessToken')!,
        firstName: mapValueOfType<String>(json, r'firstName')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        lastName: mapValueOfType<String>(json, r'lastName')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword')!,
        userEmail: mapValueOfType<String>(json, r'userEmail')!,
        userId: mapValueOfType<String>(json, r'userId')!,
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
    'firstName',
    'isAdmin',
    'lastName',
    'profileImagePath',
    'shouldChangePassword',
    'userEmail',
    'userId',
  };
}


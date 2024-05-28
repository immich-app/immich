//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LoginResponseDto {
  /// Returns a new [LoginResponseDto] instance.
  LoginResponseDto({
    required this.accessToken,
    required this.isAdmin,
    required this.name,
    required this.profileImagePath,
    required this.shouldChangePassword,
    required this.userEmail,
    required this.userId,
  });

  String accessToken;

  bool isAdmin;

  String name;

  String profileImagePath;

  bool shouldChangePassword;

  String userEmail;

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LoginResponseDto &&
    other.accessToken == accessToken &&
    other.isAdmin == isAdmin &&
    other.name == name &&
    other.profileImagePath == profileImagePath &&
    other.shouldChangePassword == shouldChangePassword &&
    other.userEmail == userEmail &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (accessToken.hashCode) +
    (isAdmin.hashCode) +
    (name.hashCode) +
    (profileImagePath.hashCode) +
    (shouldChangePassword.hashCode) +
    (userEmail.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'LoginResponseDto[accessToken=$accessToken, isAdmin=$isAdmin, name=$name, profileImagePath=$profileImagePath, shouldChangePassword=$shouldChangePassword, userEmail=$userEmail, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'accessToken'] = this.accessToken;
      json[r'isAdmin'] = this.isAdmin;
      json[r'name'] = this.name;
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
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        name: mapValueOfType<String>(json, r'name')!,
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
    'isAdmin',
    'name',
    'profileImagePath',
    'shouldChangePassword',
    'userEmail',
    'userId',
  };
}


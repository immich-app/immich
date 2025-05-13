//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AuthStatusResponseDto {
  /// Returns a new [AuthStatusResponseDto] instance.
  AuthStatusResponseDto({
    required this.isElevated,
    required this.password,
    required this.pinCode,
  });

  bool isElevated;

  bool password;

  bool pinCode;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AuthStatusResponseDto &&
    other.isElevated == isElevated &&
    other.password == password &&
    other.pinCode == pinCode;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (isElevated.hashCode) +
    (password.hashCode) +
    (pinCode.hashCode);

  @override
  String toString() => 'AuthStatusResponseDto[isElevated=$isElevated, password=$password, pinCode=$pinCode]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'isElevated'] = this.isElevated;
      json[r'password'] = this.password;
      json[r'pinCode'] = this.pinCode;
    return json;
  }

  /// Returns a new [AuthStatusResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AuthStatusResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AuthStatusResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AuthStatusResponseDto(
        isElevated: mapValueOfType<bool>(json, r'isElevated')!,
        password: mapValueOfType<bool>(json, r'password')!,
        pinCode: mapValueOfType<bool>(json, r'pinCode')!,
      );
    }
    return null;
  }

  static List<AuthStatusResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AuthStatusResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AuthStatusResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AuthStatusResponseDto> mapFromJson(dynamic json) {
    final map = <String, AuthStatusResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AuthStatusResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AuthStatusResponseDto-objects as value to a dart map
  static Map<String, List<AuthStatusResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AuthStatusResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AuthStatusResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'isElevated',
    'password',
    'pinCode',
  };
}


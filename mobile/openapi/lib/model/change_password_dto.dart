//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ChangePasswordDto {
  /// Returns a new [ChangePasswordDto] instance.
  ChangePasswordDto({
    required this.password,
    required this.newPassword,
    this.invalidateSessions = false,
  });

  /// Current password
  String password;

  /// New password (min 8 characters)
  String newPassword;

  /// Invalidate all other sessions
  bool invalidateSessions;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ChangePasswordDto &&
    other.password == password &&
    other.newPassword == newPassword &&
    other.invalidateSessions == invalidateSessions;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (password.hashCode) +
    (newPassword.hashCode) +
    (invalidateSessions.hashCode);

  @override
  String toString() => 'ChangePasswordDto[password=$password, newPassword=$newPassword, invalidateSessions=$invalidateSessions]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'password'] = this.password;
      json[r'newPassword'] = this.newPassword;
      json[r'invalidateSessions'] = this.invalidateSessions;
    return json;
  }

  /// Returns a new [ChangePasswordDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ChangePasswordDto? fromJson(dynamic value) {
    upgradeDto(value, "ChangePasswordDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ChangePasswordDto(
        password: mapValueOfType<String>(json, r'password')!,
        newPassword: mapValueOfType<String>(json, r'newPassword')!,
        invalidateSessions: mapValueOfType<bool>(json, r'invalidateSessions') ?? false,
      );
    }
    return null;
  }

  static List<ChangePasswordDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChangePasswordDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChangePasswordDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ChangePasswordDto> mapFromJson(dynamic json) {
    final map = <String, ChangePasswordDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ChangePasswordDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ChangePasswordDto-objects as value to a dart map
  static Map<String, List<ChangePasswordDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ChangePasswordDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ChangePasswordDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'password',
    'newPassword',
  };
}


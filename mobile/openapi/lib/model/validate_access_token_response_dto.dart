//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ValidateAccessTokenResponseDto {
  /// Returns a new [ValidateAccessTokenResponseDto] instance.
  ValidateAccessTokenResponseDto({
    required this.authStatus,
  });

  bool authStatus;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ValidateAccessTokenResponseDto &&
    other.authStatus == authStatus;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (authStatus.hashCode);

  @override
  String toString() => 'ValidateAccessTokenResponseDto[authStatus=$authStatus]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'authStatus'] = this.authStatus;
    return json;
  }

  /// Returns a new [ValidateAccessTokenResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ValidateAccessTokenResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ValidateAccessTokenResponseDto(
        authStatus: mapValueOfType<bool>(json, r'authStatus')!,
      );
    }
    return null;
  }

  static List<ValidateAccessTokenResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ValidateAccessTokenResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ValidateAccessTokenResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ValidateAccessTokenResponseDto> mapFromJson(dynamic json) {
    final map = <String, ValidateAccessTokenResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ValidateAccessTokenResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ValidateAccessTokenResponseDto-objects as value to a dart map
  static Map<String, List<ValidateAccessTokenResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ValidateAccessTokenResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ValidateAccessTokenResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'authStatus',
  };
}


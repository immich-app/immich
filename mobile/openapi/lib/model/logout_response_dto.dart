//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LogoutResponseDto {
  /// Returns a new [LogoutResponseDto] instance.
  LogoutResponseDto({
    required this.redirectUri,
    required this.successful,
  });

  String redirectUri;

  bool successful;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LogoutResponseDto &&
    other.redirectUri == redirectUri &&
    other.successful == successful;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (redirectUri.hashCode) +
    (successful.hashCode);

  @override
  String toString() => 'LogoutResponseDto[redirectUri=$redirectUri, successful=$successful]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'redirectUri'] = this.redirectUri;
      json[r'successful'] = this.successful;
    return json;
  }

  /// Returns a new [LogoutResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LogoutResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return LogoutResponseDto(
        redirectUri: mapValueOfType<String>(json, r'redirectUri')!,
        successful: mapValueOfType<bool>(json, r'successful')!,
      );
    }
    return null;
  }

  static List<LogoutResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LogoutResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LogoutResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LogoutResponseDto> mapFromJson(dynamic json) {
    final map = <String, LogoutResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LogoutResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LogoutResponseDto-objects as value to a dart map
  static Map<String, List<LogoutResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LogoutResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LogoutResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'redirectUri',
    'successful',
  };
}


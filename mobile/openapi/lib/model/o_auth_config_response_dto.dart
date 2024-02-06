//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OAuthConfigResponseDto {
  /// Returns a new [OAuthConfigResponseDto] instance.
  OAuthConfigResponseDto({
    this.autoLaunch,
    this.buttonText,
    required this.enabled,
    required this.passwordLoginEnabled,
    this.url,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? autoLaunch;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? buttonText;

  bool enabled;

  bool passwordLoginEnabled;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? url;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OAuthConfigResponseDto &&
    other.autoLaunch == autoLaunch &&
    other.buttonText == buttonText &&
    other.enabled == enabled &&
    other.passwordLoginEnabled == passwordLoginEnabled &&
    other.url == url;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (autoLaunch == null ? 0 : autoLaunch!.hashCode) +
    (buttonText == null ? 0 : buttonText!.hashCode) +
    (enabled.hashCode) +
    (passwordLoginEnabled.hashCode) +
    (url == null ? 0 : url!.hashCode);

  @override
  String toString() => 'OAuthConfigResponseDto[autoLaunch=$autoLaunch, buttonText=$buttonText, enabled=$enabled, passwordLoginEnabled=$passwordLoginEnabled, url=$url]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.autoLaunch != null) {
      json[r'autoLaunch'] = this.autoLaunch;
    } else {
    //  json[r'autoLaunch'] = null;
    }
    if (this.buttonText != null) {
      json[r'buttonText'] = this.buttonText;
    } else {
    //  json[r'buttonText'] = null;
    }
      json[r'enabled'] = this.enabled;
      json[r'passwordLoginEnabled'] = this.passwordLoginEnabled;
    if (this.url != null) {
      json[r'url'] = this.url;
    } else {
    //  json[r'url'] = null;
    }
    return json;
  }

  /// Returns a new [OAuthConfigResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OAuthConfigResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return OAuthConfigResponseDto(
        autoLaunch: mapValueOfType<bool>(json, r'autoLaunch'),
        buttonText: mapValueOfType<String>(json, r'buttonText'),
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        passwordLoginEnabled: mapValueOfType<bool>(json, r'passwordLoginEnabled')!,
        url: mapValueOfType<String>(json, r'url'),
      );
    }
    return null;
  }

  static List<OAuthConfigResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OAuthConfigResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OAuthConfigResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OAuthConfigResponseDto> mapFromJson(dynamic json) {
    final map = <String, OAuthConfigResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OAuthConfigResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OAuthConfigResponseDto-objects as value to a dart map
  static Map<String, List<OAuthConfigResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OAuthConfigResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OAuthConfigResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'passwordLoginEnabled',
  };
}


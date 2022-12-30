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
    required this.enabled,
    required this.passwordLoginEnabled,
    this.url,
    this.buttonText,
    this.autoLaunch,
  });

  bool enabled;

  bool passwordLoginEnabled;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? url;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? buttonText;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? autoLaunch;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OAuthConfigResponseDto &&
     other.enabled == enabled &&
     other.passwordLoginEnabled == passwordLoginEnabled &&
     other.url == url &&
     other.buttonText == buttonText &&
     other.autoLaunch == autoLaunch;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (passwordLoginEnabled.hashCode) +
    (url == null ? 0 : url!.hashCode) +
    (buttonText == null ? 0 : buttonText!.hashCode) +
    (autoLaunch == null ? 0 : autoLaunch!.hashCode);

  @override
  String toString() => 'OAuthConfigResponseDto[enabled=$enabled, passwordLoginEnabled=$passwordLoginEnabled, url=$url, buttonText=$buttonText, autoLaunch=$autoLaunch]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'enabled'] = enabled;
      _json[r'passwordLoginEnabled'] = passwordLoginEnabled;
    if (url != null) {
      _json[r'url'] = url;
    } else {
      _json[r'url'] = null;
    }
    if (buttonText != null) {
      _json[r'buttonText'] = buttonText;
    } else {
      _json[r'buttonText'] = null;
    }
    if (autoLaunch != null) {
      _json[r'autoLaunch'] = autoLaunch;
    } else {
      _json[r'autoLaunch'] = null;
    }
    return _json;
  }

  /// Returns a new [OAuthConfigResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OAuthConfigResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "OAuthConfigResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "OAuthConfigResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return OAuthConfigResponseDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        passwordLoginEnabled: mapValueOfType<bool>(json, r'passwordLoginEnabled')!,
        url: mapValueOfType<String>(json, r'url'),
        buttonText: mapValueOfType<String>(json, r'buttonText'),
        autoLaunch: mapValueOfType<bool>(json, r'autoLaunch'),
      );
    }
    return null;
  }

  static List<OAuthConfigResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
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
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OAuthConfigResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
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


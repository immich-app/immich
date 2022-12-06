//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OAuthSystemConfigResponseDto {
  /// Returns a new [OAuthSystemConfigResponseDto] instance.
  OAuthSystemConfigResponseDto({
    required this.enabled,
    required this.issuerUrl,
    required this.clientId,
    required this.clientSecret,
    required this.scope,
    required this.buttonText,
    required this.autoRegister,
  });

  bool enabled;

  String issuerUrl;

  String clientId;

  String clientSecret;

  String scope;

  String buttonText;

  bool autoRegister;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OAuthSystemConfigResponseDto &&
     other.enabled == enabled &&
     other.issuerUrl == issuerUrl &&
     other.clientId == clientId &&
     other.clientSecret == clientSecret &&
     other.scope == scope &&
     other.buttonText == buttonText &&
     other.autoRegister == autoRegister;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (issuerUrl.hashCode) +
    (clientId.hashCode) +
    (clientSecret.hashCode) +
    (scope.hashCode) +
    (buttonText.hashCode) +
    (autoRegister.hashCode);

  @override
  String toString() => 'OAuthSystemConfigResponseDto[enabled=$enabled, issuerUrl=$issuerUrl, clientId=$clientId, clientSecret=$clientSecret, scope=$scope, buttonText=$buttonText, autoRegister=$autoRegister]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'enabled'] = enabled;
      _json[r'issuerUrl'] = issuerUrl;
      _json[r'clientId'] = clientId;
      _json[r'clientSecret'] = clientSecret;
      _json[r'scope'] = scope;
      _json[r'buttonText'] = buttonText;
      _json[r'autoRegister'] = autoRegister;
    return _json;
  }

  /// Returns a new [OAuthSystemConfigResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OAuthSystemConfigResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "OAuthSystemConfigResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "OAuthSystemConfigResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return OAuthSystemConfigResponseDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        issuerUrl: mapValueOfType<String>(json, r'issuerUrl')!,
        clientId: mapValueOfType<String>(json, r'clientId')!,
        clientSecret: mapValueOfType<String>(json, r'clientSecret')!,
        scope: mapValueOfType<String>(json, r'scope')!,
        buttonText: mapValueOfType<String>(json, r'buttonText')!,
        autoRegister: mapValueOfType<bool>(json, r'autoRegister')!,
      );
    }
    return null;
  }

  static List<OAuthSystemConfigResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OAuthSystemConfigResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OAuthSystemConfigResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OAuthSystemConfigResponseDto> mapFromJson(dynamic json) {
    final map = <String, OAuthSystemConfigResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OAuthSystemConfigResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OAuthSystemConfigResponseDto-objects as value to a dart map
  static Map<String, List<OAuthSystemConfigResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OAuthSystemConfigResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OAuthSystemConfigResponseDto.listFromJson(entry.value, growable: growable,);
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
    'issuerUrl',
    'clientId',
    'clientSecret',
    'scope',
    'buttonText',
    'autoRegister',
  };
}


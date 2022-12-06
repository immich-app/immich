//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigUpdateOAuthDto {
  /// Returns a new [SystemConfigUpdateOAuthDto] instance.
  SystemConfigUpdateOAuthDto({
    required this.enabled,
    required this.issuerUrl,
    this.clientId,
    required this.clientSecret,
    this.scope,
    required this.buttonText,
    this.autoRegister,
  });

  bool enabled;

  String issuerUrl;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? clientId;

  String clientSecret;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? scope;

  String buttonText;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? autoRegister;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigUpdateOAuthDto &&
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
    (clientId == null ? 0 : clientId!.hashCode) +
    (clientSecret.hashCode) +
    (scope == null ? 0 : scope!.hashCode) +
    (buttonText.hashCode) +
    (autoRegister == null ? 0 : autoRegister!.hashCode);

  @override
  String toString() => 'SystemConfigUpdateOAuthDto[enabled=$enabled, issuerUrl=$issuerUrl, clientId=$clientId, clientSecret=$clientSecret, scope=$scope, buttonText=$buttonText, autoRegister=$autoRegister]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'enabled'] = enabled;
      _json[r'issuerUrl'] = issuerUrl;
    if (clientId != null) {
      _json[r'clientId'] = clientId;
    } else {
      _json[r'clientId'] = null;
    }
      _json[r'clientSecret'] = clientSecret;
    if (scope != null) {
      _json[r'scope'] = scope;
    } else {
      _json[r'scope'] = null;
    }
      _json[r'buttonText'] = buttonText;
    if (autoRegister != null) {
      _json[r'autoRegister'] = autoRegister;
    } else {
      _json[r'autoRegister'] = null;
    }
    return _json;
  }

  /// Returns a new [SystemConfigUpdateOAuthDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigUpdateOAuthDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SystemConfigUpdateOAuthDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SystemConfigUpdateOAuthDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SystemConfigUpdateOAuthDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        issuerUrl: mapValueOfType<String>(json, r'issuerUrl')!,
        clientId: mapValueOfType<String>(json, r'clientId'),
        clientSecret: mapValueOfType<String>(json, r'clientSecret')!,
        scope: mapValueOfType<String>(json, r'scope'),
        buttonText: mapValueOfType<String>(json, r'buttonText')!,
        autoRegister: mapValueOfType<bool>(json, r'autoRegister'),
      );
    }
    return null;
  }

  static List<SystemConfigUpdateOAuthDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigUpdateOAuthDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigUpdateOAuthDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigUpdateOAuthDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigUpdateOAuthDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigUpdateOAuthDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigUpdateOAuthDto-objects as value to a dart map
  static Map<String, List<SystemConfigUpdateOAuthDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigUpdateOAuthDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigUpdateOAuthDto.listFromJson(entry.value, growable: growable,);
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
    'clientSecret',
    'buttonText',
  };
}


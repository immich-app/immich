//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigOAuthDto {
  /// Returns a new [SystemConfigOAuthDto] instance.
  SystemConfigOAuthDto({
    required this.autoLaunch,
    required this.autoRegister,
    required this.buttonText,
    required this.clientId,
    required this.clientSecret,
    required this.enabled,
    required this.issuerUrl,
    required this.mobileOverrideEnabled,
    required this.mobileRedirectUri,
    required this.scope,
    required this.signingAlgorithm,
    required this.storageLabelClaim,
  });

  bool autoLaunch;

  bool autoRegister;

  String buttonText;

  String clientId;

  String clientSecret;

  bool enabled;

  String issuerUrl;

  bool mobileOverrideEnabled;

  String mobileRedirectUri;

  String scope;

  String signingAlgorithm;

  String storageLabelClaim;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigOAuthDto &&
    other.autoLaunch == autoLaunch &&
    other.autoRegister == autoRegister &&
    other.buttonText == buttonText &&
    other.clientId == clientId &&
    other.clientSecret == clientSecret &&
    other.enabled == enabled &&
    other.issuerUrl == issuerUrl &&
    other.mobileOverrideEnabled == mobileOverrideEnabled &&
    other.mobileRedirectUri == mobileRedirectUri &&
    other.scope == scope &&
    other.signingAlgorithm == signingAlgorithm &&
    other.storageLabelClaim == storageLabelClaim;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (autoLaunch.hashCode) +
    (autoRegister.hashCode) +
    (buttonText.hashCode) +
    (clientId.hashCode) +
    (clientSecret.hashCode) +
    (enabled.hashCode) +
    (issuerUrl.hashCode) +
    (mobileOverrideEnabled.hashCode) +
    (mobileRedirectUri.hashCode) +
    (scope.hashCode) +
    (signingAlgorithm.hashCode) +
    (storageLabelClaim.hashCode);

  @override
  String toString() => 'SystemConfigOAuthDto[autoLaunch=$autoLaunch, autoRegister=$autoRegister, buttonText=$buttonText, clientId=$clientId, clientSecret=$clientSecret, enabled=$enabled, issuerUrl=$issuerUrl, mobileOverrideEnabled=$mobileOverrideEnabled, mobileRedirectUri=$mobileRedirectUri, scope=$scope, signingAlgorithm=$signingAlgorithm, storageLabelClaim=$storageLabelClaim]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'autoLaunch'] = this.autoLaunch;
      json[r'autoRegister'] = this.autoRegister;
      json[r'buttonText'] = this.buttonText;
      json[r'clientId'] = this.clientId;
      json[r'clientSecret'] = this.clientSecret;
      json[r'enabled'] = this.enabled;
      json[r'issuerUrl'] = this.issuerUrl;
      json[r'mobileOverrideEnabled'] = this.mobileOverrideEnabled;
      json[r'mobileRedirectUri'] = this.mobileRedirectUri;
      json[r'scope'] = this.scope;
      json[r'signingAlgorithm'] = this.signingAlgorithm;
      json[r'storageLabelClaim'] = this.storageLabelClaim;
    return json;
  }

  /// Returns a new [SystemConfigOAuthDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigOAuthDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigOAuthDto(
        autoLaunch: mapValueOfType<bool>(json, r'autoLaunch')!,
        autoRegister: mapValueOfType<bool>(json, r'autoRegister')!,
        buttonText: mapValueOfType<String>(json, r'buttonText')!,
        clientId: mapValueOfType<String>(json, r'clientId')!,
        clientSecret: mapValueOfType<String>(json, r'clientSecret')!,
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        issuerUrl: mapValueOfType<String>(json, r'issuerUrl')!,
        mobileOverrideEnabled: mapValueOfType<bool>(json, r'mobileOverrideEnabled')!,
        mobileRedirectUri: mapValueOfType<String>(json, r'mobileRedirectUri')!,
        scope: mapValueOfType<String>(json, r'scope')!,
        signingAlgorithm: mapValueOfType<String>(json, r'signingAlgorithm')!,
        storageLabelClaim: mapValueOfType<String>(json, r'storageLabelClaim')!,
      );
    }
    return null;
  }

  static List<SystemConfigOAuthDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigOAuthDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigOAuthDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigOAuthDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigOAuthDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigOAuthDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigOAuthDto-objects as value to a dart map
  static Map<String, List<SystemConfigOAuthDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigOAuthDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigOAuthDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'autoLaunch',
    'autoRegister',
    'buttonText',
    'clientId',
    'clientSecret',
    'enabled',
    'issuerUrl',
    'mobileOverrideEnabled',
    'mobileRedirectUri',
    'scope',
    'signingAlgorithm',
    'storageLabelClaim',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerFeaturesDto {
  /// Returns a new [ServerFeaturesDto] instance.
  ServerFeaturesDto({
    required this.machineLearning,
    required this.oauth,
    required this.oauthAutoLaunch,
    required this.passwordLogin,
    required this.search,
  });

  bool machineLearning;

  bool oauth;

  bool oauthAutoLaunch;

  bool passwordLogin;

  bool search;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerFeaturesDto &&
     other.machineLearning == machineLearning &&
     other.oauth == oauth &&
     other.oauthAutoLaunch == oauthAutoLaunch &&
     other.passwordLogin == passwordLogin &&
     other.search == search;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (machineLearning.hashCode) +
    (oauth.hashCode) +
    (oauthAutoLaunch.hashCode) +
    (passwordLogin.hashCode) +
    (search.hashCode);

  @override
  String toString() => 'ServerFeaturesDto[machineLearning=$machineLearning, oauth=$oauth, oauthAutoLaunch=$oauthAutoLaunch, passwordLogin=$passwordLogin, search=$search]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'machineLearning'] = this.machineLearning;
      json[r'oauth'] = this.oauth;
      json[r'oauthAutoLaunch'] = this.oauthAutoLaunch;
      json[r'passwordLogin'] = this.passwordLogin;
      json[r'search'] = this.search;
    return json;
  }

  /// Returns a new [ServerFeaturesDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerFeaturesDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ServerFeaturesDto(
        machineLearning: mapValueOfType<bool>(json, r'machineLearning')!,
        oauth: mapValueOfType<bool>(json, r'oauth')!,
        oauthAutoLaunch: mapValueOfType<bool>(json, r'oauthAutoLaunch')!,
        passwordLogin: mapValueOfType<bool>(json, r'passwordLogin')!,
        search: mapValueOfType<bool>(json, r'search')!,
      );
    }
    return null;
  }

  static List<ServerFeaturesDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ServerFeaturesDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ServerFeaturesDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ServerFeaturesDto> mapFromJson(dynamic json) {
    final map = <String, ServerFeaturesDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerFeaturesDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ServerFeaturesDto-objects as value to a dart map
  static Map<String, List<ServerFeaturesDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ServerFeaturesDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ServerFeaturesDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'machineLearning',
    'oauth',
    'oauthAutoLaunch',
    'passwordLogin',
    'search',
  };
}


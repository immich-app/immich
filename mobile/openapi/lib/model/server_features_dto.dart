//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerFeaturesDto {
  /// Returns a new [ServerFeaturesDto] instance.
  ServerFeaturesDto({
    required this.configFile,
    required this.duplicateDetection,
    required this.email,
    required this.facialRecognition,
    required this.importFaces,
    required this.map,
    required this.oauth,
    required this.oauthAutoLaunch,
    required this.passwordLogin,
    required this.reverseGeocoding,
    required this.search,
    required this.sidecar,
    required this.smartSearch,
    required this.trash,
  });

  bool configFile;

  bool duplicateDetection;

  bool email;

  bool facialRecognition;

  bool importFaces;

  bool map;

  bool oauth;

  bool oauthAutoLaunch;

  bool passwordLogin;

  bool reverseGeocoding;

  bool search;

  bool sidecar;

  bool smartSearch;

  bool trash;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerFeaturesDto &&
    other.configFile == configFile &&
    other.duplicateDetection == duplicateDetection &&
    other.email == email &&
    other.facialRecognition == facialRecognition &&
    other.importFaces == importFaces &&
    other.map == map &&
    other.oauth == oauth &&
    other.oauthAutoLaunch == oauthAutoLaunch &&
    other.passwordLogin == passwordLogin &&
    other.reverseGeocoding == reverseGeocoding &&
    other.search == search &&
    other.sidecar == sidecar &&
    other.smartSearch == smartSearch &&
    other.trash == trash;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (configFile.hashCode) +
    (duplicateDetection.hashCode) +
    (email.hashCode) +
    (facialRecognition.hashCode) +
    (importFaces.hashCode) +
    (map.hashCode) +
    (oauth.hashCode) +
    (oauthAutoLaunch.hashCode) +
    (passwordLogin.hashCode) +
    (reverseGeocoding.hashCode) +
    (search.hashCode) +
    (sidecar.hashCode) +
    (smartSearch.hashCode) +
    (trash.hashCode);

  @override
  String toString() => 'ServerFeaturesDto[configFile=$configFile, duplicateDetection=$duplicateDetection, email=$email, facialRecognition=$facialRecognition, importFaces=$importFaces, map=$map, oauth=$oauth, oauthAutoLaunch=$oauthAutoLaunch, passwordLogin=$passwordLogin, reverseGeocoding=$reverseGeocoding, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, trash=$trash]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'configFile'] = this.configFile;
      json[r'duplicateDetection'] = this.duplicateDetection;
      json[r'email'] = this.email;
      json[r'facialRecognition'] = this.facialRecognition;
      json[r'importFaces'] = this.importFaces;
      json[r'map'] = this.map;
      json[r'oauth'] = this.oauth;
      json[r'oauthAutoLaunch'] = this.oauthAutoLaunch;
      json[r'passwordLogin'] = this.passwordLogin;
      json[r'reverseGeocoding'] = this.reverseGeocoding;
      json[r'search'] = this.search;
      json[r'sidecar'] = this.sidecar;
      json[r'smartSearch'] = this.smartSearch;
      json[r'trash'] = this.trash;
    return json;
  }

  /// Returns a new [ServerFeaturesDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerFeaturesDto? fromJson(dynamic value) {
    upgradeDto(value, "ServerFeaturesDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ServerFeaturesDto(
        configFile: mapValueOfType<bool>(json, r'configFile')!,
        duplicateDetection: mapValueOfType<bool>(json, r'duplicateDetection')!,
        email: mapValueOfType<bool>(json, r'email')!,
        facialRecognition: mapValueOfType<bool>(json, r'facialRecognition')!,
        importFaces: mapValueOfType<bool>(json, r'importFaces')!,
        map: mapValueOfType<bool>(json, r'map')!,
        oauth: mapValueOfType<bool>(json, r'oauth')!,
        oauthAutoLaunch: mapValueOfType<bool>(json, r'oauthAutoLaunch')!,
        passwordLogin: mapValueOfType<bool>(json, r'passwordLogin')!,
        reverseGeocoding: mapValueOfType<bool>(json, r'reverseGeocoding')!,
        search: mapValueOfType<bool>(json, r'search')!,
        sidecar: mapValueOfType<bool>(json, r'sidecar')!,
        smartSearch: mapValueOfType<bool>(json, r'smartSearch')!,
        trash: mapValueOfType<bool>(json, r'trash')!,
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
    'configFile',
    'duplicateDetection',
    'email',
    'facialRecognition',
    'importFaces',
    'map',
    'oauth',
    'oauthAutoLaunch',
    'passwordLogin',
    'reverseGeocoding',
    'search',
    'sidecar',
    'smartSearch',
    'trash',
  };
}


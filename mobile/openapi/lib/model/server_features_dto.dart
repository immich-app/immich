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
    required this.ocr,
    required this.passwordLogin,
    required this.realtimeTranscoding,
    required this.reverseGeocoding,
    required this.search,
    required this.sidecar,
    required this.smartSearch,
    required this.trash,
  });

  /// Whether config file is available
  bool configFile;

  /// Whether duplicate detection is enabled
  bool duplicateDetection;

  /// Whether email notifications are enabled
  bool email;

  /// Whether facial recognition is enabled
  bool facialRecognition;

  /// Whether face import is enabled
  bool importFaces;

  /// Whether map feature is enabled
  bool map;

  /// Whether OAuth is enabled
  bool oauth;

  /// Whether OAuth auto-launch is enabled
  bool oauthAutoLaunch;

  /// Whether OCR is enabled
  bool ocr;

  /// Whether password login is enabled
  bool passwordLogin;

  /// Whether real-time transcoding is enabled
  bool realtimeTranscoding;

  /// Whether reverse geocoding is enabled
  bool reverseGeocoding;

  /// Whether search is enabled
  bool search;

  /// Whether sidecar files are supported
  bool sidecar;

  /// Whether smart search is enabled
  bool smartSearch;

  /// Whether trash feature is enabled
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
    other.ocr == ocr &&
    other.passwordLogin == passwordLogin &&
    other.realtimeTranscoding == realtimeTranscoding &&
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
    (ocr.hashCode) +
    (passwordLogin.hashCode) +
    (realtimeTranscoding.hashCode) +
    (reverseGeocoding.hashCode) +
    (search.hashCode) +
    (sidecar.hashCode) +
    (smartSearch.hashCode) +
    (trash.hashCode);

  @override
  String toString() => 'ServerFeaturesDto[configFile=$configFile, duplicateDetection=$duplicateDetection, email=$email, facialRecognition=$facialRecognition, importFaces=$importFaces, map=$map, oauth=$oauth, oauthAutoLaunch=$oauthAutoLaunch, ocr=$ocr, passwordLogin=$passwordLogin, realtimeTranscoding=$realtimeTranscoding, reverseGeocoding=$reverseGeocoding, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, trash=$trash]';

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
      json[r'ocr'] = this.ocr;
      json[r'passwordLogin'] = this.passwordLogin;
      json[r'realtimeTranscoding'] = this.realtimeTranscoding;
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
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'configFile'), 'Required key "ServerFeaturesDto[configFile]" is missing from JSON.');
        assert(json[r'configFile'] != null, 'Required key "ServerFeaturesDto[configFile]" has a null value in JSON.');
        assert(json.containsKey(r'duplicateDetection'), 'Required key "ServerFeaturesDto[duplicateDetection]" is missing from JSON.');
        assert(json[r'duplicateDetection'] != null, 'Required key "ServerFeaturesDto[duplicateDetection]" has a null value in JSON.');
        assert(json.containsKey(r'email'), 'Required key "ServerFeaturesDto[email]" is missing from JSON.');
        assert(json[r'email'] != null, 'Required key "ServerFeaturesDto[email]" has a null value in JSON.');
        assert(json.containsKey(r'facialRecognition'), 'Required key "ServerFeaturesDto[facialRecognition]" is missing from JSON.');
        assert(json[r'facialRecognition'] != null, 'Required key "ServerFeaturesDto[facialRecognition]" has a null value in JSON.');
        assert(json.containsKey(r'importFaces'), 'Required key "ServerFeaturesDto[importFaces]" is missing from JSON.');
        assert(json[r'importFaces'] != null, 'Required key "ServerFeaturesDto[importFaces]" has a null value in JSON.');
        assert(json.containsKey(r'map'), 'Required key "ServerFeaturesDto[map]" is missing from JSON.');
        assert(json[r'map'] != null, 'Required key "ServerFeaturesDto[map]" has a null value in JSON.');
        assert(json.containsKey(r'oauth'), 'Required key "ServerFeaturesDto[oauth]" is missing from JSON.');
        assert(json[r'oauth'] != null, 'Required key "ServerFeaturesDto[oauth]" has a null value in JSON.');
        assert(json.containsKey(r'oauthAutoLaunch'), 'Required key "ServerFeaturesDto[oauthAutoLaunch]" is missing from JSON.');
        assert(json[r'oauthAutoLaunch'] != null, 'Required key "ServerFeaturesDto[oauthAutoLaunch]" has a null value in JSON.');
        assert(json.containsKey(r'ocr'), 'Required key "ServerFeaturesDto[ocr]" is missing from JSON.');
        assert(json[r'ocr'] != null, 'Required key "ServerFeaturesDto[ocr]" has a null value in JSON.');
        assert(json.containsKey(r'passwordLogin'), 'Required key "ServerFeaturesDto[passwordLogin]" is missing from JSON.');
        assert(json[r'passwordLogin'] != null, 'Required key "ServerFeaturesDto[passwordLogin]" has a null value in JSON.');
        assert(json.containsKey(r'realtimeTranscoding'), 'Required key "ServerFeaturesDto[realtimeTranscoding]" is missing from JSON.');
        assert(json[r'realtimeTranscoding'] != null, 'Required key "ServerFeaturesDto[realtimeTranscoding]" has a null value in JSON.');
        assert(json.containsKey(r'reverseGeocoding'), 'Required key "ServerFeaturesDto[reverseGeocoding]" is missing from JSON.');
        assert(json[r'reverseGeocoding'] != null, 'Required key "ServerFeaturesDto[reverseGeocoding]" has a null value in JSON.');
        assert(json.containsKey(r'search'), 'Required key "ServerFeaturesDto[search]" is missing from JSON.');
        assert(json[r'search'] != null, 'Required key "ServerFeaturesDto[search]" has a null value in JSON.');
        assert(json.containsKey(r'sidecar'), 'Required key "ServerFeaturesDto[sidecar]" is missing from JSON.');
        assert(json[r'sidecar'] != null, 'Required key "ServerFeaturesDto[sidecar]" has a null value in JSON.');
        assert(json.containsKey(r'smartSearch'), 'Required key "ServerFeaturesDto[smartSearch]" is missing from JSON.');
        assert(json[r'smartSearch'] != null, 'Required key "ServerFeaturesDto[smartSearch]" has a null value in JSON.');
        assert(json.containsKey(r'trash'), 'Required key "ServerFeaturesDto[trash]" is missing from JSON.');
        assert(json[r'trash'] != null, 'Required key "ServerFeaturesDto[trash]" has a null value in JSON.');
        return true;
      }());

      return ServerFeaturesDto(
        configFile: mapValueOfType<bool>(json, r'configFile')!,
        duplicateDetection: mapValueOfType<bool>(json, r'duplicateDetection')!,
        email: mapValueOfType<bool>(json, r'email')!,
        facialRecognition: mapValueOfType<bool>(json, r'facialRecognition')!,
        importFaces: mapValueOfType<bool>(json, r'importFaces')!,
        map: mapValueOfType<bool>(json, r'map')!,
        oauth: mapValueOfType<bool>(json, r'oauth')!,
        oauthAutoLaunch: mapValueOfType<bool>(json, r'oauthAutoLaunch')!,
        ocr: mapValueOfType<bool>(json, r'ocr')!,
        passwordLogin: mapValueOfType<bool>(json, r'passwordLogin')!,
        realtimeTranscoding: mapValueOfType<bool>(json, r'realtimeTranscoding')!,
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
    'ocr',
    'passwordLogin',
    'realtimeTranscoding',
    'reverseGeocoding',
    'search',
    'sidecar',
    'smartSearch',
    'trash',
  };
}


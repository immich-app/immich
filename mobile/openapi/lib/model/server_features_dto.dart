// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ServerFeaturesDto {
  const ServerFeaturesDto({
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
    required this.reverseGeocoding,
    required this.search,
    required this.sidecar,
    required this.smartSearch,
    required this.trash,
  });

  /// Whether config file is available
  final bool configFile;

  /// Whether duplicate detection is enabled
  final bool duplicateDetection;

  /// Whether email notifications are enabled
  final bool email;

  /// Whether facial recognition is enabled
  final bool facialRecognition;

  /// Whether face import is enabled
  final bool importFaces;

  /// Whether map feature is enabled
  final bool map;

  /// Whether OAuth is enabled
  final bool oauth;

  /// Whether OAuth auto-launch is enabled
  final bool oauthAutoLaunch;

  /// Whether OCR is enabled
  final bool ocr;

  /// Whether password login is enabled
  final bool passwordLogin;

  /// Whether reverse geocoding is enabled
  final bool reverseGeocoding;

  /// Whether search is enabled
  final bool search;

  /// Whether sidecar files are supported
  final bool sidecar;

  /// Whether smart search is enabled
  final bool smartSearch;

  /// Whether trash feature is enabled
  final bool trash;

  static ServerFeaturesDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ServerFeaturesDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      configFile: json[r'configFile'] as bool,
      duplicateDetection: json[r'duplicateDetection'] as bool,
      email: json[r'email'] as bool,
      facialRecognition: json[r'facialRecognition'] as bool,
      importFaces: json[r'importFaces'] as bool,
      map: json[r'map'] as bool,
      oauth: json[r'oauth'] as bool,
      oauthAutoLaunch: json[r'oauthAutoLaunch'] as bool,
      ocr: json[r'ocr'] as bool,
      passwordLogin: json[r'passwordLogin'] as bool,
      reverseGeocoding: json[r'reverseGeocoding'] as bool,
      search: json[r'search'] as bool,
      sidecar: json[r'sidecar'] as bool,
      smartSearch: json[r'smartSearch'] as bool,
      trash: json[r'trash'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'configFile'] = configFile;
    json[r'duplicateDetection'] = duplicateDetection;
    json[r'email'] = email;
    json[r'facialRecognition'] = facialRecognition;
    json[r'importFaces'] = importFaces;
    json[r'map'] = map;
    json[r'oauth'] = oauth;
    json[r'oauthAutoLaunch'] = oauthAutoLaunch;
    json[r'ocr'] = ocr;
    json[r'passwordLogin'] = passwordLogin;
    json[r'reverseGeocoding'] = reverseGeocoding;
    json[r'search'] = search;
    json[r'sidecar'] = sidecar;
    json[r'smartSearch'] = smartSearch;
    json[r'trash'] = trash;
    return json;
  }

  ServerFeaturesDto copyWith({
    bool? configFile,
    bool? duplicateDetection,
    bool? email,
    bool? facialRecognition,
    bool? importFaces,
    bool? map,
    bool? oauth,
    bool? oauthAutoLaunch,
    bool? ocr,
    bool? passwordLogin,
    bool? reverseGeocoding,
    bool? search,
    bool? sidecar,
    bool? smartSearch,
    bool? trash,
  }) {
    return .new(
      configFile: configFile ?? this.configFile,
      duplicateDetection: duplicateDetection ?? this.duplicateDetection,
      email: email ?? this.email,
      facialRecognition: facialRecognition ?? this.facialRecognition,
      importFaces: importFaces ?? this.importFaces,
      map: map ?? this.map,
      oauth: oauth ?? this.oauth,
      oauthAutoLaunch: oauthAutoLaunch ?? this.oauthAutoLaunch,
      ocr: ocr ?? this.ocr,
      passwordLogin: passwordLogin ?? this.passwordLogin,
      reverseGeocoding: reverseGeocoding ?? this.reverseGeocoding,
      search: search ?? this.search,
      sidecar: sidecar ?? this.sidecar,
      smartSearch: smartSearch ?? this.smartSearch,
      trash: trash ?? this.trash,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ServerFeaturesDto &&
            configFile == other.configFile &&
            duplicateDetection == other.duplicateDetection &&
            email == other.email &&
            facialRecognition == other.facialRecognition &&
            importFaces == other.importFaces &&
            map == other.map &&
            oauth == other.oauth &&
            oauthAutoLaunch == other.oauthAutoLaunch &&
            ocr == other.ocr &&
            passwordLogin == other.passwordLogin &&
            reverseGeocoding == other.reverseGeocoding &&
            search == other.search &&
            sidecar == other.sidecar &&
            smartSearch == other.smartSearch &&
            trash == other.trash);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      configFile,
      duplicateDetection,
      email,
      facialRecognition,
      importFaces,
      map,
      oauth,
      oauthAutoLaunch,
      ocr,
      passwordLogin,
      reverseGeocoding,
      search,
      sidecar,
      smartSearch,
      trash,
    ]);
  }

  @override
  String toString() =>
      'ServerFeaturesDto(configFile=$configFile, duplicateDetection=$duplicateDetection, email=$email, facialRecognition=$facialRecognition, importFaces=$importFaces, map=$map, oauth=$oauth, oauthAutoLaunch=$oauthAutoLaunch, ocr=$ocr, passwordLogin=$passwordLogin, reverseGeocoding=$reverseGeocoding, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, trash=$trash)';
}

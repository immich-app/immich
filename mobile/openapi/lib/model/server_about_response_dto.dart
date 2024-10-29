//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerAboutResponseDto {
  /// Returns a new [ServerAboutResponseDto] instance.
  ServerAboutResponseDto({
    this.build,
    this.buildImage,
    this.buildImageUrl,
    this.buildUrl,
    this.exiftool,
    this.ffmpeg,
    this.imagemagick,
    this.libvips,
    required this.licensed,
    this.nodejs,
    this.repository,
    this.repositoryUrl,
    this.sourceCommit,
    this.sourceRef,
    this.sourceUrl,
    this.thirdPartyBugFeatureUrl,
    this.thirdPartyDocumentationUrl,
    this.thirdPartySourceUrl,
    this.thirdPartySupportUrl,
    required this.version,
    required this.versionUrl,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? build;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? buildImage;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? buildImageUrl;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? buildUrl;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? exiftool;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? ffmpeg;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? imagemagick;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? libvips;

  bool licensed;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? nodejs;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? repository;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? repositoryUrl;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? sourceCommit;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? sourceRef;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? sourceUrl;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? thirdPartyBugFeatureUrl;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? thirdPartyDocumentationUrl;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? thirdPartySourceUrl;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? thirdPartySupportUrl;

  String version;

  String versionUrl;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerAboutResponseDto &&
    other.build == build &&
    other.buildImage == buildImage &&
    other.buildImageUrl == buildImageUrl &&
    other.buildUrl == buildUrl &&
    other.exiftool == exiftool &&
    other.ffmpeg == ffmpeg &&
    other.imagemagick == imagemagick &&
    other.libvips == libvips &&
    other.licensed == licensed &&
    other.nodejs == nodejs &&
    other.repository == repository &&
    other.repositoryUrl == repositoryUrl &&
    other.sourceCommit == sourceCommit &&
    other.sourceRef == sourceRef &&
    other.sourceUrl == sourceUrl &&
    other.thirdPartyBugFeatureUrl == thirdPartyBugFeatureUrl &&
    other.thirdPartyDocumentationUrl == thirdPartyDocumentationUrl &&
    other.thirdPartySourceUrl == thirdPartySourceUrl &&
    other.thirdPartySupportUrl == thirdPartySupportUrl &&
    other.version == version &&
    other.versionUrl == versionUrl;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (build == null ? 0 : build!.hashCode) +
    (buildImage == null ? 0 : buildImage!.hashCode) +
    (buildImageUrl == null ? 0 : buildImageUrl!.hashCode) +
    (buildUrl == null ? 0 : buildUrl!.hashCode) +
    (exiftool == null ? 0 : exiftool!.hashCode) +
    (ffmpeg == null ? 0 : ffmpeg!.hashCode) +
    (imagemagick == null ? 0 : imagemagick!.hashCode) +
    (libvips == null ? 0 : libvips!.hashCode) +
    (licensed.hashCode) +
    (nodejs == null ? 0 : nodejs!.hashCode) +
    (repository == null ? 0 : repository!.hashCode) +
    (repositoryUrl == null ? 0 : repositoryUrl!.hashCode) +
    (sourceCommit == null ? 0 : sourceCommit!.hashCode) +
    (sourceRef == null ? 0 : sourceRef!.hashCode) +
    (sourceUrl == null ? 0 : sourceUrl!.hashCode) +
    (thirdPartyBugFeatureUrl == null ? 0 : thirdPartyBugFeatureUrl!.hashCode) +
    (thirdPartyDocumentationUrl == null ? 0 : thirdPartyDocumentationUrl!.hashCode) +
    (thirdPartySourceUrl == null ? 0 : thirdPartySourceUrl!.hashCode) +
    (thirdPartySupportUrl == null ? 0 : thirdPartySupportUrl!.hashCode) +
    (version.hashCode) +
    (versionUrl.hashCode);

  @override
  String toString() => 'ServerAboutResponseDto[build=$build, buildImage=$buildImage, buildImageUrl=$buildImageUrl, buildUrl=$buildUrl, exiftool=$exiftool, ffmpeg=$ffmpeg, imagemagick=$imagemagick, libvips=$libvips, licensed=$licensed, nodejs=$nodejs, repository=$repository, repositoryUrl=$repositoryUrl, sourceCommit=$sourceCommit, sourceRef=$sourceRef, sourceUrl=$sourceUrl, thirdPartyBugFeatureUrl=$thirdPartyBugFeatureUrl, thirdPartyDocumentationUrl=$thirdPartyDocumentationUrl, thirdPartySourceUrl=$thirdPartySourceUrl, thirdPartySupportUrl=$thirdPartySupportUrl, version=$version, versionUrl=$versionUrl]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.build != null) {
      json[r'build'] = this.build;
    } else {
    //  json[r'build'] = null;
    }
    if (this.buildImage != null) {
      json[r'buildImage'] = this.buildImage;
    } else {
    //  json[r'buildImage'] = null;
    }
    if (this.buildImageUrl != null) {
      json[r'buildImageUrl'] = this.buildImageUrl;
    } else {
    //  json[r'buildImageUrl'] = null;
    }
    if (this.buildUrl != null) {
      json[r'buildUrl'] = this.buildUrl;
    } else {
    //  json[r'buildUrl'] = null;
    }
    if (this.exiftool != null) {
      json[r'exiftool'] = this.exiftool;
    } else {
    //  json[r'exiftool'] = null;
    }
    if (this.ffmpeg != null) {
      json[r'ffmpeg'] = this.ffmpeg;
    } else {
    //  json[r'ffmpeg'] = null;
    }
    if (this.imagemagick != null) {
      json[r'imagemagick'] = this.imagemagick;
    } else {
    //  json[r'imagemagick'] = null;
    }
    if (this.libvips != null) {
      json[r'libvips'] = this.libvips;
    } else {
    //  json[r'libvips'] = null;
    }
      json[r'licensed'] = this.licensed;
    if (this.nodejs != null) {
      json[r'nodejs'] = this.nodejs;
    } else {
    //  json[r'nodejs'] = null;
    }
    if (this.repository != null) {
      json[r'repository'] = this.repository;
    } else {
    //  json[r'repository'] = null;
    }
    if (this.repositoryUrl != null) {
      json[r'repositoryUrl'] = this.repositoryUrl;
    } else {
    //  json[r'repositoryUrl'] = null;
    }
    if (this.sourceCommit != null) {
      json[r'sourceCommit'] = this.sourceCommit;
    } else {
    //  json[r'sourceCommit'] = null;
    }
    if (this.sourceRef != null) {
      json[r'sourceRef'] = this.sourceRef;
    } else {
    //  json[r'sourceRef'] = null;
    }
    if (this.sourceUrl != null) {
      json[r'sourceUrl'] = this.sourceUrl;
    } else {
    //  json[r'sourceUrl'] = null;
    }
    if (this.thirdPartyBugFeatureUrl != null) {
      json[r'thirdPartyBugFeatureUrl'] = this.thirdPartyBugFeatureUrl;
    } else {
    //  json[r'thirdPartyBugFeatureUrl'] = null;
    }
    if (this.thirdPartyDocumentationUrl != null) {
      json[r'thirdPartyDocumentationUrl'] = this.thirdPartyDocumentationUrl;
    } else {
    //  json[r'thirdPartyDocumentationUrl'] = null;
    }
    if (this.thirdPartySourceUrl != null) {
      json[r'thirdPartySourceUrl'] = this.thirdPartySourceUrl;
    } else {
    //  json[r'thirdPartySourceUrl'] = null;
    }
    if (this.thirdPartySupportUrl != null) {
      json[r'thirdPartySupportUrl'] = this.thirdPartySupportUrl;
    } else {
    //  json[r'thirdPartySupportUrl'] = null;
    }
      json[r'version'] = this.version;
      json[r'versionUrl'] = this.versionUrl;
    return json;
  }

  /// Returns a new [ServerAboutResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerAboutResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ServerAboutResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ServerAboutResponseDto(
        build: mapValueOfType<String>(json, r'build'),
        buildImage: mapValueOfType<String>(json, r'buildImage'),
        buildImageUrl: mapValueOfType<String>(json, r'buildImageUrl'),
        buildUrl: mapValueOfType<String>(json, r'buildUrl'),
        exiftool: mapValueOfType<String>(json, r'exiftool'),
        ffmpeg: mapValueOfType<String>(json, r'ffmpeg'),
        imagemagick: mapValueOfType<String>(json, r'imagemagick'),
        libvips: mapValueOfType<String>(json, r'libvips'),
        licensed: mapValueOfType<bool>(json, r'licensed')!,
        nodejs: mapValueOfType<String>(json, r'nodejs'),
        repository: mapValueOfType<String>(json, r'repository'),
        repositoryUrl: mapValueOfType<String>(json, r'repositoryUrl'),
        sourceCommit: mapValueOfType<String>(json, r'sourceCommit'),
        sourceRef: mapValueOfType<String>(json, r'sourceRef'),
        sourceUrl: mapValueOfType<String>(json, r'sourceUrl'),
        thirdPartyBugFeatureUrl: mapValueOfType<String>(json, r'thirdPartyBugFeatureUrl'),
        thirdPartyDocumentationUrl: mapValueOfType<String>(json, r'thirdPartyDocumentationUrl'),
        thirdPartySourceUrl: mapValueOfType<String>(json, r'thirdPartySourceUrl'),
        thirdPartySupportUrl: mapValueOfType<String>(json, r'thirdPartySupportUrl'),
        version: mapValueOfType<String>(json, r'version')!,
        versionUrl: mapValueOfType<String>(json, r'versionUrl')!,
      );
    }
    return null;
  }

  static List<ServerAboutResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ServerAboutResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ServerAboutResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ServerAboutResponseDto> mapFromJson(dynamic json) {
    final map = <String, ServerAboutResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerAboutResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ServerAboutResponseDto-objects as value to a dart map
  static Map<String, List<ServerAboutResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ServerAboutResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ServerAboutResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'licensed',
    'version',
    'versionUrl',
  };
}


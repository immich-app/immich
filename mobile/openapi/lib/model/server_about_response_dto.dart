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
    this.build = const Optional.absent(),
    this.buildImage = const Optional.absent(),
    this.buildImageUrl = const Optional.absent(),
    this.buildUrl = const Optional.absent(),
    this.exiftool = const Optional.absent(),
    this.ffmpeg = const Optional.absent(),
    this.imagemagick = const Optional.absent(),
    this.libvips = const Optional.absent(),
    required this.licensed,
    this.nodejs = const Optional.absent(),
    this.repository = const Optional.absent(),
    this.repositoryUrl = const Optional.absent(),
    this.sourceCommit = const Optional.absent(),
    this.sourceRef = const Optional.absent(),
    this.sourceUrl = const Optional.absent(),
    this.thirdPartyBugFeatureUrl = const Optional.absent(),
    this.thirdPartyDocumentationUrl = const Optional.absent(),
    this.thirdPartySourceUrl = const Optional.absent(),
    this.thirdPartySupportUrl = const Optional.absent(),
    required this.version,
    required this.versionUrl,
  });

  /// Build identifier
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> build;

  /// Build image name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> buildImage;

  /// Build image URL
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> buildImageUrl;

  /// Build URL
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> buildUrl;

  /// ExifTool version
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> exiftool;

  /// FFmpeg version
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> ffmpeg;

  /// ImageMagick version
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> imagemagick;

  /// libvips version
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> libvips;

  /// Whether the server is licensed
  bool licensed;

  /// Node.js version
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> nodejs;

  /// Repository name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> repository;

  /// Repository URL
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> repositoryUrl;

  /// Source commit hash
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> sourceCommit;

  /// Source reference (branch/tag)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> sourceRef;

  /// Source URL
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> sourceUrl;

  /// Third-party bug/feature URL
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> thirdPartyBugFeatureUrl;

  /// Third-party documentation URL
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> thirdPartyDocumentationUrl;

  /// Third-party source URL
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> thirdPartySourceUrl;

  /// Third-party support URL
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> thirdPartySupportUrl;

  /// Server version
  String version;

  /// URL to version information
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
    if (this.build.isPresent) {
      final value = this.build.value;
      json[r'build'] = value;
    }
    if (this.buildImage.isPresent) {
      final value = this.buildImage.value;
      json[r'buildImage'] = value;
    }
    if (this.buildImageUrl.isPresent) {
      final value = this.buildImageUrl.value;
      json[r'buildImageUrl'] = value;
    }
    if (this.buildUrl.isPresent) {
      final value = this.buildUrl.value;
      json[r'buildUrl'] = value;
    }
    if (this.exiftool.isPresent) {
      final value = this.exiftool.value;
      json[r'exiftool'] = value;
    }
    if (this.ffmpeg.isPresent) {
      final value = this.ffmpeg.value;
      json[r'ffmpeg'] = value;
    }
    if (this.imagemagick.isPresent) {
      final value = this.imagemagick.value;
      json[r'imagemagick'] = value;
    }
    if (this.libvips.isPresent) {
      final value = this.libvips.value;
      json[r'libvips'] = value;
    }
      json[r'licensed'] = this.licensed;
    if (this.nodejs.isPresent) {
      final value = this.nodejs.value;
      json[r'nodejs'] = value;
    }
    if (this.repository.isPresent) {
      final value = this.repository.value;
      json[r'repository'] = value;
    }
    if (this.repositoryUrl.isPresent) {
      final value = this.repositoryUrl.value;
      json[r'repositoryUrl'] = value;
    }
    if (this.sourceCommit.isPresent) {
      final value = this.sourceCommit.value;
      json[r'sourceCommit'] = value;
    }
    if (this.sourceRef.isPresent) {
      final value = this.sourceRef.value;
      json[r'sourceRef'] = value;
    }
    if (this.sourceUrl.isPresent) {
      final value = this.sourceUrl.value;
      json[r'sourceUrl'] = value;
    }
    if (this.thirdPartyBugFeatureUrl.isPresent) {
      final value = this.thirdPartyBugFeatureUrl.value;
      json[r'thirdPartyBugFeatureUrl'] = value;
    }
    if (this.thirdPartyDocumentationUrl.isPresent) {
      final value = this.thirdPartyDocumentationUrl.value;
      json[r'thirdPartyDocumentationUrl'] = value;
    }
    if (this.thirdPartySourceUrl.isPresent) {
      final value = this.thirdPartySourceUrl.value;
      json[r'thirdPartySourceUrl'] = value;
    }
    if (this.thirdPartySupportUrl.isPresent) {
      final value = this.thirdPartySupportUrl.value;
      json[r'thirdPartySupportUrl'] = value;
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
        build: json.containsKey(r'build') ? Optional.present(mapValueOfType<String>(json, r'build')) : const Optional.absent(),
        buildImage: json.containsKey(r'buildImage') ? Optional.present(mapValueOfType<String>(json, r'buildImage')) : const Optional.absent(),
        buildImageUrl: json.containsKey(r'buildImageUrl') ? Optional.present(mapValueOfType<String>(json, r'buildImageUrl')) : const Optional.absent(),
        buildUrl: json.containsKey(r'buildUrl') ? Optional.present(mapValueOfType<String>(json, r'buildUrl')) : const Optional.absent(),
        exiftool: json.containsKey(r'exiftool') ? Optional.present(mapValueOfType<String>(json, r'exiftool')) : const Optional.absent(),
        ffmpeg: json.containsKey(r'ffmpeg') ? Optional.present(mapValueOfType<String>(json, r'ffmpeg')) : const Optional.absent(),
        imagemagick: json.containsKey(r'imagemagick') ? Optional.present(mapValueOfType<String>(json, r'imagemagick')) : const Optional.absent(),
        libvips: json.containsKey(r'libvips') ? Optional.present(mapValueOfType<String>(json, r'libvips')) : const Optional.absent(),
        licensed: mapValueOfType<bool>(json, r'licensed')!,
        nodejs: json.containsKey(r'nodejs') ? Optional.present(mapValueOfType<String>(json, r'nodejs')) : const Optional.absent(),
        repository: json.containsKey(r'repository') ? Optional.present(mapValueOfType<String>(json, r'repository')) : const Optional.absent(),
        repositoryUrl: json.containsKey(r'repositoryUrl') ? Optional.present(mapValueOfType<String>(json, r'repositoryUrl')) : const Optional.absent(),
        sourceCommit: json.containsKey(r'sourceCommit') ? Optional.present(mapValueOfType<String>(json, r'sourceCommit')) : const Optional.absent(),
        sourceRef: json.containsKey(r'sourceRef') ? Optional.present(mapValueOfType<String>(json, r'sourceRef')) : const Optional.absent(),
        sourceUrl: json.containsKey(r'sourceUrl') ? Optional.present(mapValueOfType<String>(json, r'sourceUrl')) : const Optional.absent(),
        thirdPartyBugFeatureUrl: json.containsKey(r'thirdPartyBugFeatureUrl') ? Optional.present(mapValueOfType<String>(json, r'thirdPartyBugFeatureUrl')) : const Optional.absent(),
        thirdPartyDocumentationUrl: json.containsKey(r'thirdPartyDocumentationUrl') ? Optional.present(mapValueOfType<String>(json, r'thirdPartyDocumentationUrl')) : const Optional.absent(),
        thirdPartySourceUrl: json.containsKey(r'thirdPartySourceUrl') ? Optional.present(mapValueOfType<String>(json, r'thirdPartySourceUrl')) : const Optional.absent(),
        thirdPartySupportUrl: json.containsKey(r'thirdPartySupportUrl') ? Optional.present(mapValueOfType<String>(json, r'thirdPartySupportUrl')) : const Optional.absent(),
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


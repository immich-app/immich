// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ServerAboutResponseDto {
  const ServerAboutResponseDto({
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

  /// Build identifier
  final String? build;

  /// Build image name
  final String? buildImage;

  /// Build image URL
  final String? buildImageUrl;

  /// Build URL
  final String? buildUrl;

  /// ExifTool version
  final String? exiftool;

  /// FFmpeg version
  final String? ffmpeg;

  /// ImageMagick version
  final String? imagemagick;

  /// libvips version
  final String? libvips;

  /// Whether the server is licensed
  final bool licensed;

  /// Node.js version
  final String? nodejs;

  /// Repository name
  final String? repository;

  /// Repository URL
  final String? repositoryUrl;

  /// Source commit hash
  final String? sourceCommit;

  /// Source reference (branch/tag)
  final String? sourceRef;

  /// Source URL
  final String? sourceUrl;

  /// Third-party bug/feature URL
  final String? thirdPartyBugFeatureUrl;

  /// Third-party documentation URL
  final String? thirdPartyDocumentationUrl;

  /// Third-party source URL
  final String? thirdPartySourceUrl;

  /// Third-party support URL
  final String? thirdPartySupportUrl;

  /// Server version
  final String version;

  /// URL to version information
  final String versionUrl;

  static const _undefined = Object();

  static ServerAboutResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ServerAboutResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      build: (json[r'build'] as String?),
      buildImage: (json[r'buildImage'] as String?),
      buildImageUrl: (json[r'buildImageUrl'] as String?),
      buildUrl: (json[r'buildUrl'] as String?),
      exiftool: (json[r'exiftool'] as String?),
      ffmpeg: (json[r'ffmpeg'] as String?),
      imagemagick: (json[r'imagemagick'] as String?),
      libvips: (json[r'libvips'] as String?),
      licensed: json[r'licensed'] as bool,
      nodejs: (json[r'nodejs'] as String?),
      repository: (json[r'repository'] as String?),
      repositoryUrl: (json[r'repositoryUrl'] as String?),
      sourceCommit: (json[r'sourceCommit'] as String?),
      sourceRef: (json[r'sourceRef'] as String?),
      sourceUrl: (json[r'sourceUrl'] as String?),
      thirdPartyBugFeatureUrl: (json[r'thirdPartyBugFeatureUrl'] as String?),
      thirdPartyDocumentationUrl: (json[r'thirdPartyDocumentationUrl'] as String?),
      thirdPartySourceUrl: (json[r'thirdPartySourceUrl'] as String?),
      thirdPartySupportUrl: (json[r'thirdPartySupportUrl'] as String?),
      version: json[r'version'] as String,
      versionUrl: json[r'versionUrl'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (build != null) {
      json[r'build'] = build!;
    }
    if (buildImage != null) {
      json[r'buildImage'] = buildImage!;
    }
    if (buildImageUrl != null) {
      json[r'buildImageUrl'] = buildImageUrl!;
    }
    if (buildUrl != null) {
      json[r'buildUrl'] = buildUrl!;
    }
    if (exiftool != null) {
      json[r'exiftool'] = exiftool!;
    }
    if (ffmpeg != null) {
      json[r'ffmpeg'] = ffmpeg!;
    }
    if (imagemagick != null) {
      json[r'imagemagick'] = imagemagick!;
    }
    if (libvips != null) {
      json[r'libvips'] = libvips!;
    }
    json[r'licensed'] = licensed;
    if (nodejs != null) {
      json[r'nodejs'] = nodejs!;
    }
    if (repository != null) {
      json[r'repository'] = repository!;
    }
    if (repositoryUrl != null) {
      json[r'repositoryUrl'] = repositoryUrl!;
    }
    if (sourceCommit != null) {
      json[r'sourceCommit'] = sourceCommit!;
    }
    if (sourceRef != null) {
      json[r'sourceRef'] = sourceRef!;
    }
    if (sourceUrl != null) {
      json[r'sourceUrl'] = sourceUrl!;
    }
    if (thirdPartyBugFeatureUrl != null) {
      json[r'thirdPartyBugFeatureUrl'] = thirdPartyBugFeatureUrl!;
    }
    if (thirdPartyDocumentationUrl != null) {
      json[r'thirdPartyDocumentationUrl'] = thirdPartyDocumentationUrl!;
    }
    if (thirdPartySourceUrl != null) {
      json[r'thirdPartySourceUrl'] = thirdPartySourceUrl!;
    }
    if (thirdPartySupportUrl != null) {
      json[r'thirdPartySupportUrl'] = thirdPartySupportUrl!;
    }
    json[r'version'] = version;
    json[r'versionUrl'] = versionUrl;
    return json;
  }

  ServerAboutResponseDto copyWith({
    Object? build = _undefined,
    Object? buildImage = _undefined,
    Object? buildImageUrl = _undefined,
    Object? buildUrl = _undefined,
    Object? exiftool = _undefined,
    Object? ffmpeg = _undefined,
    Object? imagemagick = _undefined,
    Object? libvips = _undefined,
    bool? licensed,
    Object? nodejs = _undefined,
    Object? repository = _undefined,
    Object? repositoryUrl = _undefined,
    Object? sourceCommit = _undefined,
    Object? sourceRef = _undefined,
    Object? sourceUrl = _undefined,
    Object? thirdPartyBugFeatureUrl = _undefined,
    Object? thirdPartyDocumentationUrl = _undefined,
    Object? thirdPartySourceUrl = _undefined,
    Object? thirdPartySupportUrl = _undefined,
    String? version,
    String? versionUrl,
  }) {
    return .new(
      build: identical(build, _undefined) ? this.build : build as String?,
      buildImage: identical(buildImage, _undefined) ? this.buildImage : buildImage as String?,
      buildImageUrl: identical(buildImageUrl, _undefined) ? this.buildImageUrl : buildImageUrl as String?,
      buildUrl: identical(buildUrl, _undefined) ? this.buildUrl : buildUrl as String?,
      exiftool: identical(exiftool, _undefined) ? this.exiftool : exiftool as String?,
      ffmpeg: identical(ffmpeg, _undefined) ? this.ffmpeg : ffmpeg as String?,
      imagemagick: identical(imagemagick, _undefined) ? this.imagemagick : imagemagick as String?,
      libvips: identical(libvips, _undefined) ? this.libvips : libvips as String?,
      licensed: licensed ?? this.licensed,
      nodejs: identical(nodejs, _undefined) ? this.nodejs : nodejs as String?,
      repository: identical(repository, _undefined) ? this.repository : repository as String?,
      repositoryUrl: identical(repositoryUrl, _undefined) ? this.repositoryUrl : repositoryUrl as String?,
      sourceCommit: identical(sourceCommit, _undefined) ? this.sourceCommit : sourceCommit as String?,
      sourceRef: identical(sourceRef, _undefined) ? this.sourceRef : sourceRef as String?,
      sourceUrl: identical(sourceUrl, _undefined) ? this.sourceUrl : sourceUrl as String?,
      thirdPartyBugFeatureUrl: identical(thirdPartyBugFeatureUrl, _undefined)
          ? this.thirdPartyBugFeatureUrl
          : thirdPartyBugFeatureUrl as String?,
      thirdPartyDocumentationUrl: identical(thirdPartyDocumentationUrl, _undefined)
          ? this.thirdPartyDocumentationUrl
          : thirdPartyDocumentationUrl as String?,
      thirdPartySourceUrl: identical(thirdPartySourceUrl, _undefined)
          ? this.thirdPartySourceUrl
          : thirdPartySourceUrl as String?,
      thirdPartySupportUrl: identical(thirdPartySupportUrl, _undefined)
          ? this.thirdPartySupportUrl
          : thirdPartySupportUrl as String?,
      version: version ?? this.version,
      versionUrl: versionUrl ?? this.versionUrl,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ServerAboutResponseDto &&
            build == other.build &&
            buildImage == other.buildImage &&
            buildImageUrl == other.buildImageUrl &&
            buildUrl == other.buildUrl &&
            exiftool == other.exiftool &&
            ffmpeg == other.ffmpeg &&
            imagemagick == other.imagemagick &&
            libvips == other.libvips &&
            licensed == other.licensed &&
            nodejs == other.nodejs &&
            repository == other.repository &&
            repositoryUrl == other.repositoryUrl &&
            sourceCommit == other.sourceCommit &&
            sourceRef == other.sourceRef &&
            sourceUrl == other.sourceUrl &&
            thirdPartyBugFeatureUrl == other.thirdPartyBugFeatureUrl &&
            thirdPartyDocumentationUrl == other.thirdPartyDocumentationUrl &&
            thirdPartySourceUrl == other.thirdPartySourceUrl &&
            thirdPartySupportUrl == other.thirdPartySupportUrl &&
            version == other.version &&
            versionUrl == other.versionUrl);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      build,
      buildImage,
      buildImageUrl,
      buildUrl,
      exiftool,
      ffmpeg,
      imagemagick,
      libvips,
      licensed,
      nodejs,
      repository,
      repositoryUrl,
      sourceCommit,
      sourceRef,
      sourceUrl,
      thirdPartyBugFeatureUrl,
      thirdPartyDocumentationUrl,
      thirdPartySourceUrl,
      thirdPartySupportUrl,
      version,
      versionUrl,
    ]);
  }

  @override
  String toString() =>
      'ServerAboutResponseDto(build=$build, buildImage=$buildImage, buildImageUrl=$buildImageUrl, buildUrl=$buildUrl, exiftool=$exiftool, ffmpeg=$ffmpeg, imagemagick=$imagemagick, libvips=$libvips, licensed=$licensed, nodejs=$nodejs, repository=$repository, repositoryUrl=$repositoryUrl, sourceCommit=$sourceCommit, sourceRef=$sourceRef, sourceUrl=$sourceUrl, thirdPartyBugFeatureUrl=$thirdPartyBugFeatureUrl, thirdPartyDocumentationUrl=$thirdPartyDocumentationUrl, thirdPartySourceUrl=$thirdPartySourceUrl, thirdPartySupportUrl=$thirdPartySupportUrl, version=$version, versionUrl=$versionUrl)';
}

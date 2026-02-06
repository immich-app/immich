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
    required this.version,
    required this.versionUrl,
    this.repository,
    this.repositoryUrl,
    this.sourceRef,
    this.sourceCommit,
    this.sourceUrl,
    this.build,
    this.buildUrl,
    this.nodejs,
  });

  /// Server version
  String version;

  /// URL to version information
  String versionUrl;

  /// Repository name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? repository;

  /// Repository URL
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? repositoryUrl;

  /// Source reference (branch/tag)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? sourceRef;

  /// Source commit hash
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? sourceCommit;

  /// Source URL
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? sourceUrl;

  /// Build identifier
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? build;

  /// Build URL
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? buildUrl;

  /// Node.js version
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? nodejs;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerAboutResponseDto &&
    other.version == version &&
    other.versionUrl == versionUrl &&
    other.repository == repository &&
    other.repositoryUrl == repositoryUrl &&
    other.sourceRef == sourceRef &&
    other.sourceCommit == sourceCommit &&
    other.sourceUrl == sourceUrl &&
    other.build == build &&
    other.buildUrl == buildUrl &&
    other.nodejs == nodejs;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (version.hashCode) +
    (versionUrl.hashCode) +
    (repository == null ? 0 : repository!.hashCode) +
    (repositoryUrl == null ? 0 : repositoryUrl!.hashCode) +
    (sourceRef == null ? 0 : sourceRef!.hashCode) +
    (sourceCommit == null ? 0 : sourceCommit!.hashCode) +
    (sourceUrl == null ? 0 : sourceUrl!.hashCode) +
    (build == null ? 0 : build!.hashCode) +
    (buildUrl == null ? 0 : buildUrl!.hashCode) +
    (nodejs == null ? 0 : nodejs!.hashCode);

  @override
  String toString() => 'ServerAboutResponseDto[version=$version, versionUrl=$versionUrl, repository=$repository, repositoryUrl=$repositoryUrl, sourceRef=$sourceRef, sourceCommit=$sourceCommit, sourceUrl=$sourceUrl, build=$build, buildUrl=$buildUrl, nodejs=$nodejs]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'version'] = this.version;
      json[r'versionUrl'] = this.versionUrl;
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
    if (this.sourceRef != null) {
      json[r'sourceRef'] = this.sourceRef;
    } else {
    //  json[r'sourceRef'] = null;
    }
    if (this.sourceCommit != null) {
      json[r'sourceCommit'] = this.sourceCommit;
    } else {
    //  json[r'sourceCommit'] = null;
    }
    if (this.sourceUrl != null) {
      json[r'sourceUrl'] = this.sourceUrl;
    } else {
    //  json[r'sourceUrl'] = null;
    }
    if (this.build != null) {
      json[r'build'] = this.build;
    } else {
    //  json[r'build'] = null;
    }
    if (this.buildUrl != null) {
      json[r'buildUrl'] = this.buildUrl;
    } else {
    //  json[r'buildUrl'] = null;
    }
    if (this.nodejs != null) {
      json[r'nodejs'] = this.nodejs;
    } else {
    //  json[r'nodejs'] = null;
    }
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
        version: mapValueOfType<String>(json, r'version')!,
        versionUrl: mapValueOfType<String>(json, r'versionUrl')!,
        repository: mapValueOfType<String>(json, r'repository'),
        repositoryUrl: mapValueOfType<String>(json, r'repositoryUrl'),
        sourceRef: mapValueOfType<String>(json, r'sourceRef'),
        sourceCommit: mapValueOfType<String>(json, r'sourceCommit'),
        sourceUrl: mapValueOfType<String>(json, r'sourceUrl'),
        build: mapValueOfType<String>(json, r'build'),
        buildUrl: mapValueOfType<String>(json, r'buildUrl'),
        nodejs: mapValueOfType<String>(json, r'nodejs'),
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
    'version',
    'versionUrl',
  };
}


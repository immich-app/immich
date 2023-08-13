//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigDto {
  /// Returns a new [SystemConfigDto] instance.
  SystemConfigDto({
    required this.ffmpeg,
    required this.job,
    required this.oauth,
    required this.passwordLogin,
    required this.storageTemplate,
    required this.thumbnail,
  });

  SystemConfigFFmpegDto ffmpeg;

  SystemConfigJobDto job;

  SystemConfigOAuthDto oauth;

  SystemConfigPasswordLoginDto passwordLogin;

  SystemConfigStorageTemplateDto storageTemplate;

  SystemConfigThumbnailDto thumbnail;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigDto &&
     other.ffmpeg == ffmpeg &&
     other.job == job &&
     other.oauth == oauth &&
     other.passwordLogin == passwordLogin &&
     other.storageTemplate == storageTemplate &&
     other.thumbnail == thumbnail;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (ffmpeg.hashCode) +
    (job.hashCode) +
    (oauth.hashCode) +
    (passwordLogin.hashCode) +
    (storageTemplate.hashCode) +
    (thumbnail.hashCode);

  @override
  String toString() => 'SystemConfigDto[ffmpeg=$ffmpeg, job=$job, oauth=$oauth, passwordLogin=$passwordLogin, storageTemplate=$storageTemplate, thumbnail=$thumbnail]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'ffmpeg'] = this.ffmpeg;
      json[r'job'] = this.job;
      json[r'oauth'] = this.oauth;
      json[r'passwordLogin'] = this.passwordLogin;
      json[r'storageTemplate'] = this.storageTemplate;
      json[r'thumbnail'] = this.thumbnail;
    return json;
  }

  /// Returns a new [SystemConfigDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigDto(
        ffmpeg: SystemConfigFFmpegDto.fromJson(json[r'ffmpeg'])!,
        job: SystemConfigJobDto.fromJson(json[r'job'])!,
        oauth: SystemConfigOAuthDto.fromJson(json[r'oauth'])!,
        passwordLogin: SystemConfigPasswordLoginDto.fromJson(json[r'passwordLogin'])!,
        storageTemplate: SystemConfigStorageTemplateDto.fromJson(json[r'storageTemplate'])!,
        thumbnail: SystemConfigThumbnailDto.fromJson(json[r'thumbnail'])!,
      );
    }
    return null;
  }

  static List<SystemConfigDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigDto-objects as value to a dart map
  static Map<String, List<SystemConfigDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'ffmpeg',
    'job',
    'oauth',
    'passwordLogin',
    'storageTemplate',
    'thumbnail',
  };
}


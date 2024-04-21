//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PartialSystemConfigDto {
  /// Returns a new [PartialSystemConfigDto] instance.
  PartialSystemConfigDto({
    this.ffmpeg,
    this.image,
    this.job,
    this.library_,
    this.logging,
    this.machineLearning,
    this.map,
    this.newVersionCheck,
    this.oauth,
    this.passwordLogin,
    this.reverseGeocoding,
    this.server,
    this.storageTemplate,
    this.theme,
    this.trash,
    this.user,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigFFmpegDto? ffmpeg;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigImageDto? image;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigJobDto? job;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigLibraryDto? library_;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigLoggingDto? logging;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigMachineLearningDto? machineLearning;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigMapDto? map;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigNewVersionCheckDto? newVersionCheck;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigOAuthDto? oauth;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigPasswordLoginDto? passwordLogin;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigReverseGeocodingDto? reverseGeocoding;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigServerDto? server;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigStorageTemplateDto? storageTemplate;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigThemeDto? theme;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigTrashDto? trash;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigUserDto? user;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PartialSystemConfigDto &&
    other.ffmpeg == ffmpeg &&
    other.image == image &&
    other.job == job &&
    other.library_ == library_ &&
    other.logging == logging &&
    other.machineLearning == machineLearning &&
    other.map == map &&
    other.newVersionCheck == newVersionCheck &&
    other.oauth == oauth &&
    other.passwordLogin == passwordLogin &&
    other.reverseGeocoding == reverseGeocoding &&
    other.server == server &&
    other.storageTemplate == storageTemplate &&
    other.theme == theme &&
    other.trash == trash &&
    other.user == user;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (ffmpeg == null ? 0 : ffmpeg!.hashCode) +
    (image == null ? 0 : image!.hashCode) +
    (job == null ? 0 : job!.hashCode) +
    (library_ == null ? 0 : library_!.hashCode) +
    (logging == null ? 0 : logging!.hashCode) +
    (machineLearning == null ? 0 : machineLearning!.hashCode) +
    (map == null ? 0 : map!.hashCode) +
    (newVersionCheck == null ? 0 : newVersionCheck!.hashCode) +
    (oauth == null ? 0 : oauth!.hashCode) +
    (passwordLogin == null ? 0 : passwordLogin!.hashCode) +
    (reverseGeocoding == null ? 0 : reverseGeocoding!.hashCode) +
    (server == null ? 0 : server!.hashCode) +
    (storageTemplate == null ? 0 : storageTemplate!.hashCode) +
    (theme == null ? 0 : theme!.hashCode) +
    (trash == null ? 0 : trash!.hashCode) +
    (user == null ? 0 : user!.hashCode);

  @override
  String toString() => 'PartialSystemConfigDto[ffmpeg=$ffmpeg, image=$image, job=$job, library_=$library_, logging=$logging, machineLearning=$machineLearning, map=$map, newVersionCheck=$newVersionCheck, oauth=$oauth, passwordLogin=$passwordLogin, reverseGeocoding=$reverseGeocoding, server=$server, storageTemplate=$storageTemplate, theme=$theme, trash=$trash, user=$user]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.ffmpeg != null) {
      json[r'ffmpeg'] = this.ffmpeg;
    } else {
    //  json[r'ffmpeg'] = null;
    }
    if (this.image != null) {
      json[r'image'] = this.image;
    } else {
    //  json[r'image'] = null;
    }
    if (this.job != null) {
      json[r'job'] = this.job;
    } else {
    //  json[r'job'] = null;
    }
    if (this.library_ != null) {
      json[r'library'] = this.library_;
    } else {
    //  json[r'library'] = null;
    }
    if (this.logging != null) {
      json[r'logging'] = this.logging;
    } else {
    //  json[r'logging'] = null;
    }
    if (this.machineLearning != null) {
      json[r'machineLearning'] = this.machineLearning;
    } else {
    //  json[r'machineLearning'] = null;
    }
    if (this.map != null) {
      json[r'map'] = this.map;
    } else {
    //  json[r'map'] = null;
    }
    if (this.newVersionCheck != null) {
      json[r'newVersionCheck'] = this.newVersionCheck;
    } else {
    //  json[r'newVersionCheck'] = null;
    }
    if (this.oauth != null) {
      json[r'oauth'] = this.oauth;
    } else {
    //  json[r'oauth'] = null;
    }
    if (this.passwordLogin != null) {
      json[r'passwordLogin'] = this.passwordLogin;
    } else {
    //  json[r'passwordLogin'] = null;
    }
    if (this.reverseGeocoding != null) {
      json[r'reverseGeocoding'] = this.reverseGeocoding;
    } else {
    //  json[r'reverseGeocoding'] = null;
    }
    if (this.server != null) {
      json[r'server'] = this.server;
    } else {
    //  json[r'server'] = null;
    }
    if (this.storageTemplate != null) {
      json[r'storageTemplate'] = this.storageTemplate;
    } else {
    //  json[r'storageTemplate'] = null;
    }
    if (this.theme != null) {
      json[r'theme'] = this.theme;
    } else {
    //  json[r'theme'] = null;
    }
    if (this.trash != null) {
      json[r'trash'] = this.trash;
    } else {
    //  json[r'trash'] = null;
    }
    if (this.user != null) {
      json[r'user'] = this.user;
    } else {
    //  json[r'user'] = null;
    }
    return json;
  }

  /// Returns a new [PartialSystemConfigDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PartialSystemConfigDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PartialSystemConfigDto(
        ffmpeg: SystemConfigFFmpegDto.fromJson(json[r'ffmpeg']),
        image: SystemConfigImageDto.fromJson(json[r'image']),
        job: SystemConfigJobDto.fromJson(json[r'job']),
        library_: SystemConfigLibraryDto.fromJson(json[r'library']),
        logging: SystemConfigLoggingDto.fromJson(json[r'logging']),
        machineLearning: SystemConfigMachineLearningDto.fromJson(json[r'machineLearning']),
        map: SystemConfigMapDto.fromJson(json[r'map']),
        newVersionCheck: SystemConfigNewVersionCheckDto.fromJson(json[r'newVersionCheck']),
        oauth: SystemConfigOAuthDto.fromJson(json[r'oauth']),
        passwordLogin: SystemConfigPasswordLoginDto.fromJson(json[r'passwordLogin']),
        reverseGeocoding: SystemConfigReverseGeocodingDto.fromJson(json[r'reverseGeocoding']),
        server: SystemConfigServerDto.fromJson(json[r'server']),
        storageTemplate: SystemConfigStorageTemplateDto.fromJson(json[r'storageTemplate']),
        theme: SystemConfigThemeDto.fromJson(json[r'theme']),
        trash: SystemConfigTrashDto.fromJson(json[r'trash']),
        user: SystemConfigUserDto.fromJson(json[r'user']),
      );
    }
    return null;
  }

  static List<PartialSystemConfigDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PartialSystemConfigDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PartialSystemConfigDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PartialSystemConfigDto> mapFromJson(dynamic json) {
    final map = <String, PartialSystemConfigDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PartialSystemConfigDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PartialSystemConfigDto-objects as value to a dart map
  static Map<String, List<PartialSystemConfigDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PartialSystemConfigDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PartialSystemConfigDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


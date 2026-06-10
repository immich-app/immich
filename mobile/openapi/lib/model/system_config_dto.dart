//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigDto {
  /// Returns a new [SystemConfigDto] instance.
  SystemConfigDto({
    required this.backup,
    required this.ffmpeg,
    required this.image,
    required this.job,
    required this.library_,
    required this.logging,
    required this.machineLearning,
    required this.map,
    required this.metadata,
    required this.newVersionCheck,
    required this.nightlyTasks,
    required this.notifications,
    required this.oauth,
    required this.passwordLogin,
    required this.reverseGeocoding,
    required this.server,
    required this.storageTemplate,
    required this.templates,
    required this.theme,
    required this.trash,
    required this.user,
  });

  SystemConfigBackupsDto backup;

  SystemConfigFFmpegDto ffmpeg;

  SystemConfigImageDto image;

  SystemConfigJobDto job;

  SystemConfigLibraryDto library_;

  SystemConfigLoggingDto logging;

  SystemConfigMachineLearningDto machineLearning;

  SystemConfigMapDto map;

  SystemConfigMetadataDto metadata;

  SystemConfigNewVersionCheckDto newVersionCheck;

  SystemConfigNightlyTasksDto nightlyTasks;

  SystemConfigNotificationsDto notifications;

  SystemConfigOAuthDto oauth;

  SystemConfigPasswordLoginDto passwordLogin;

  SystemConfigReverseGeocodingDto reverseGeocoding;

  SystemConfigServerDto server;

  SystemConfigStorageTemplateDto storageTemplate;

  SystemConfigTemplatesDto templates;

  SystemConfigThemeDto theme;

  SystemConfigTrashDto trash;

  SystemConfigUserDto user;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigDto &&
    other.backup == backup &&
    other.ffmpeg == ffmpeg &&
    other.image == image &&
    other.job == job &&
    other.library_ == library_ &&
    other.logging == logging &&
    other.machineLearning == machineLearning &&
    other.map == map &&
    other.metadata == metadata &&
    other.newVersionCheck == newVersionCheck &&
    other.nightlyTasks == nightlyTasks &&
    other.notifications == notifications &&
    other.oauth == oauth &&
    other.passwordLogin == passwordLogin &&
    other.reverseGeocoding == reverseGeocoding &&
    other.server == server &&
    other.storageTemplate == storageTemplate &&
    other.templates == templates &&
    other.theme == theme &&
    other.trash == trash &&
    other.user == user;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backup.hashCode) +
    (ffmpeg.hashCode) +
    (image.hashCode) +
    (job.hashCode) +
    (library_.hashCode) +
    (logging.hashCode) +
    (machineLearning.hashCode) +
    (map.hashCode) +
    (metadata.hashCode) +
    (newVersionCheck.hashCode) +
    (nightlyTasks.hashCode) +
    (notifications.hashCode) +
    (oauth.hashCode) +
    (passwordLogin.hashCode) +
    (reverseGeocoding.hashCode) +
    (server.hashCode) +
    (storageTemplate.hashCode) +
    (templates.hashCode) +
    (theme.hashCode) +
    (trash.hashCode) +
    (user.hashCode);

  @override
  String toString() => 'SystemConfigDto[backup=$backup, ffmpeg=$ffmpeg, image=$image, job=$job, library_=$library_, logging=$logging, machineLearning=$machineLearning, map=$map, metadata=$metadata, newVersionCheck=$newVersionCheck, nightlyTasks=$nightlyTasks, notifications=$notifications, oauth=$oauth, passwordLogin=$passwordLogin, reverseGeocoding=$reverseGeocoding, server=$server, storageTemplate=$storageTemplate, templates=$templates, theme=$theme, trash=$trash, user=$user]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backup'] = this.backup;
      json[r'ffmpeg'] = this.ffmpeg;
      json[r'image'] = this.image;
      json[r'job'] = this.job;
      json[r'library'] = this.library_;
      json[r'logging'] = this.logging;
      json[r'machineLearning'] = this.machineLearning;
      json[r'map'] = this.map;
      json[r'metadata'] = this.metadata;
      json[r'newVersionCheck'] = this.newVersionCheck;
      json[r'nightlyTasks'] = this.nightlyTasks;
      json[r'notifications'] = this.notifications;
      json[r'oauth'] = this.oauth;
      json[r'passwordLogin'] = this.passwordLogin;
      json[r'reverseGeocoding'] = this.reverseGeocoding;
      json[r'server'] = this.server;
      json[r'storageTemplate'] = this.storageTemplate;
      json[r'templates'] = this.templates;
      json[r'theme'] = this.theme;
      json[r'trash'] = this.trash;
      json[r'user'] = this.user;
    return json;
  }

  /// Returns a new [SystemConfigDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'backup'), 'Required key "SystemConfigDto[backup]" is missing from JSON.');
        assert(json[r'backup'] != null, 'Required key "SystemConfigDto[backup]" has a null value in JSON.');
        assert(json.containsKey(r'ffmpeg'), 'Required key "SystemConfigDto[ffmpeg]" is missing from JSON.');
        assert(json[r'ffmpeg'] != null, 'Required key "SystemConfigDto[ffmpeg]" has a null value in JSON.');
        assert(json.containsKey(r'image'), 'Required key "SystemConfigDto[image]" is missing from JSON.');
        assert(json[r'image'] != null, 'Required key "SystemConfigDto[image]" has a null value in JSON.');
        assert(json.containsKey(r'job'), 'Required key "SystemConfigDto[job]" is missing from JSON.');
        assert(json[r'job'] != null, 'Required key "SystemConfigDto[job]" has a null value in JSON.');
        assert(json.containsKey(r'library'), 'Required key "SystemConfigDto[library]" is missing from JSON.');
        assert(json[r'library'] != null, 'Required key "SystemConfigDto[library]" has a null value in JSON.');
        assert(json.containsKey(r'logging'), 'Required key "SystemConfigDto[logging]" is missing from JSON.');
        assert(json[r'logging'] != null, 'Required key "SystemConfigDto[logging]" has a null value in JSON.');
        assert(json.containsKey(r'machineLearning'), 'Required key "SystemConfigDto[machineLearning]" is missing from JSON.');
        assert(json[r'machineLearning'] != null, 'Required key "SystemConfigDto[machineLearning]" has a null value in JSON.');
        assert(json.containsKey(r'map'), 'Required key "SystemConfigDto[map]" is missing from JSON.');
        assert(json[r'map'] != null, 'Required key "SystemConfigDto[map]" has a null value in JSON.');
        assert(json.containsKey(r'metadata'), 'Required key "SystemConfigDto[metadata]" is missing from JSON.');
        assert(json[r'metadata'] != null, 'Required key "SystemConfigDto[metadata]" has a null value in JSON.');
        assert(json.containsKey(r'newVersionCheck'), 'Required key "SystemConfigDto[newVersionCheck]" is missing from JSON.');
        assert(json[r'newVersionCheck'] != null, 'Required key "SystemConfigDto[newVersionCheck]" has a null value in JSON.');
        assert(json.containsKey(r'nightlyTasks'), 'Required key "SystemConfigDto[nightlyTasks]" is missing from JSON.');
        assert(json[r'nightlyTasks'] != null, 'Required key "SystemConfigDto[nightlyTasks]" has a null value in JSON.');
        assert(json.containsKey(r'notifications'), 'Required key "SystemConfigDto[notifications]" is missing from JSON.');
        assert(json[r'notifications'] != null, 'Required key "SystemConfigDto[notifications]" has a null value in JSON.');
        assert(json.containsKey(r'oauth'), 'Required key "SystemConfigDto[oauth]" is missing from JSON.');
        assert(json[r'oauth'] != null, 'Required key "SystemConfigDto[oauth]" has a null value in JSON.');
        assert(json.containsKey(r'passwordLogin'), 'Required key "SystemConfigDto[passwordLogin]" is missing from JSON.');
        assert(json[r'passwordLogin'] != null, 'Required key "SystemConfigDto[passwordLogin]" has a null value in JSON.');
        assert(json.containsKey(r'reverseGeocoding'), 'Required key "SystemConfigDto[reverseGeocoding]" is missing from JSON.');
        assert(json[r'reverseGeocoding'] != null, 'Required key "SystemConfigDto[reverseGeocoding]" has a null value in JSON.');
        assert(json.containsKey(r'server'), 'Required key "SystemConfigDto[server]" is missing from JSON.');
        assert(json[r'server'] != null, 'Required key "SystemConfigDto[server]" has a null value in JSON.');
        assert(json.containsKey(r'storageTemplate'), 'Required key "SystemConfigDto[storageTemplate]" is missing from JSON.');
        assert(json[r'storageTemplate'] != null, 'Required key "SystemConfigDto[storageTemplate]" has a null value in JSON.');
        assert(json.containsKey(r'templates'), 'Required key "SystemConfigDto[templates]" is missing from JSON.');
        assert(json[r'templates'] != null, 'Required key "SystemConfigDto[templates]" has a null value in JSON.');
        assert(json.containsKey(r'theme'), 'Required key "SystemConfigDto[theme]" is missing from JSON.');
        assert(json[r'theme'] != null, 'Required key "SystemConfigDto[theme]" has a null value in JSON.');
        assert(json.containsKey(r'trash'), 'Required key "SystemConfigDto[trash]" is missing from JSON.');
        assert(json[r'trash'] != null, 'Required key "SystemConfigDto[trash]" has a null value in JSON.');
        assert(json.containsKey(r'user'), 'Required key "SystemConfigDto[user]" is missing from JSON.');
        assert(json[r'user'] != null, 'Required key "SystemConfigDto[user]" has a null value in JSON.');
        return true;
      }());

      return SystemConfigDto(
        backup: SystemConfigBackupsDto.fromJson(json[r'backup'])!,
        ffmpeg: SystemConfigFFmpegDto.fromJson(json[r'ffmpeg'])!,
        image: SystemConfigImageDto.fromJson(json[r'image'])!,
        job: SystemConfigJobDto.fromJson(json[r'job'])!,
        library_: SystemConfigLibraryDto.fromJson(json[r'library'])!,
        logging: SystemConfigLoggingDto.fromJson(json[r'logging'])!,
        machineLearning: SystemConfigMachineLearningDto.fromJson(json[r'machineLearning'])!,
        map: SystemConfigMapDto.fromJson(json[r'map'])!,
        metadata: SystemConfigMetadataDto.fromJson(json[r'metadata'])!,
        newVersionCheck: SystemConfigNewVersionCheckDto.fromJson(json[r'newVersionCheck'])!,
        nightlyTasks: SystemConfigNightlyTasksDto.fromJson(json[r'nightlyTasks'])!,
        notifications: SystemConfigNotificationsDto.fromJson(json[r'notifications'])!,
        oauth: SystemConfigOAuthDto.fromJson(json[r'oauth'])!,
        passwordLogin: SystemConfigPasswordLoginDto.fromJson(json[r'passwordLogin'])!,
        reverseGeocoding: SystemConfigReverseGeocodingDto.fromJson(json[r'reverseGeocoding'])!,
        server: SystemConfigServerDto.fromJson(json[r'server'])!,
        storageTemplate: SystemConfigStorageTemplateDto.fromJson(json[r'storageTemplate'])!,
        templates: SystemConfigTemplatesDto.fromJson(json[r'templates'])!,
        theme: SystemConfigThemeDto.fromJson(json[r'theme'])!,
        trash: SystemConfigTrashDto.fromJson(json[r'trash'])!,
        user: SystemConfigUserDto.fromJson(json[r'user'])!,
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
    'backup',
    'ffmpeg',
    'image',
    'job',
    'library',
    'logging',
    'machineLearning',
    'map',
    'metadata',
    'newVersionCheck',
    'nightlyTasks',
    'notifications',
    'oauth',
    'passwordLogin',
    'reverseGeocoding',
    'server',
    'storageTemplate',
    'templates',
    'theme',
    'trash',
    'user',
  };
}


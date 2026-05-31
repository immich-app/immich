// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// System configuration
final class SystemConfigDto {
  const SystemConfigDto({
    required this.backup,
    required this.ffmpeg,
    required this.image,
    required this.job,
    required this.library$,
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

  final SystemConfigBackupsDto backup;

  final SystemConfigFFmpegDto ffmpeg;

  final SystemConfigImageDto image;

  final SystemConfigJobDto job;

  final SystemConfigLibraryDto library$;

  final SystemConfigLoggingDto logging;

  final SystemConfigMachineLearningDto machineLearning;

  final SystemConfigMapDto map;

  final SystemConfigMetadataDto metadata;

  final SystemConfigNewVersionCheckDto newVersionCheck;

  final SystemConfigNightlyTasksDto nightlyTasks;

  final SystemConfigNotificationsDto notifications;

  final SystemConfigOAuthDto oauth;

  final SystemConfigPasswordLoginDto passwordLogin;

  final SystemConfigReverseGeocodingDto reverseGeocoding;

  final SystemConfigServerDto server;

  final SystemConfigStorageTemplateDto storageTemplate;

  final SystemConfigTemplatesDto templates;

  final SystemConfigThemeDto theme;

  final SystemConfigTrashDto trash;

  final SystemConfigUserDto user;

  static SystemConfigDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      backup: (SystemConfigBackupsDto.fromJson(json[r'backup']))!,
      ffmpeg: (SystemConfigFFmpegDto.fromJson(json[r'ffmpeg']))!,
      image: (SystemConfigImageDto.fromJson(json[r'image']))!,
      job: (SystemConfigJobDto.fromJson(json[r'job']))!,
      library$: (SystemConfigLibraryDto.fromJson(json[r'library']))!,
      logging: (SystemConfigLoggingDto.fromJson(json[r'logging']))!,
      machineLearning: (SystemConfigMachineLearningDto.fromJson(json[r'machineLearning']))!,
      map: (SystemConfigMapDto.fromJson(json[r'map']))!,
      metadata: (SystemConfigMetadataDto.fromJson(json[r'metadata']))!,
      newVersionCheck: (SystemConfigNewVersionCheckDto.fromJson(json[r'newVersionCheck']))!,
      nightlyTasks: (SystemConfigNightlyTasksDto.fromJson(json[r'nightlyTasks']))!,
      notifications: (SystemConfigNotificationsDto.fromJson(json[r'notifications']))!,
      oauth: (SystemConfigOAuthDto.fromJson(json[r'oauth']))!,
      passwordLogin: (SystemConfigPasswordLoginDto.fromJson(json[r'passwordLogin']))!,
      reverseGeocoding: (SystemConfigReverseGeocodingDto.fromJson(json[r'reverseGeocoding']))!,
      server: (SystemConfigServerDto.fromJson(json[r'server']))!,
      storageTemplate: (SystemConfigStorageTemplateDto.fromJson(json[r'storageTemplate']))!,
      templates: (SystemConfigTemplatesDto.fromJson(json[r'templates']))!,
      theme: (SystemConfigThemeDto.fromJson(json[r'theme']))!,
      trash: (SystemConfigTrashDto.fromJson(json[r'trash']))!,
      user: (SystemConfigUserDto.fromJson(json[r'user']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'backup'] = backup.toJson();
    json[r'ffmpeg'] = ffmpeg.toJson();
    json[r'image'] = image.toJson();
    json[r'job'] = job.toJson();
    json[r'library'] = library$.toJson();
    json[r'logging'] = logging.toJson();
    json[r'machineLearning'] = machineLearning.toJson();
    json[r'map'] = map.toJson();
    json[r'metadata'] = metadata.toJson();
    json[r'newVersionCheck'] = newVersionCheck.toJson();
    json[r'nightlyTasks'] = nightlyTasks.toJson();
    json[r'notifications'] = notifications.toJson();
    json[r'oauth'] = oauth.toJson();
    json[r'passwordLogin'] = passwordLogin.toJson();
    json[r'reverseGeocoding'] = reverseGeocoding.toJson();
    json[r'server'] = server.toJson();
    json[r'storageTemplate'] = storageTemplate.toJson();
    json[r'templates'] = templates.toJson();
    json[r'theme'] = theme.toJson();
    json[r'trash'] = trash.toJson();
    json[r'user'] = user.toJson();
    return json;
  }

  SystemConfigDto copyWith({
    SystemConfigBackupsDto? backup,
    SystemConfigFFmpegDto? ffmpeg,
    SystemConfigImageDto? image,
    SystemConfigJobDto? job,
    SystemConfigLibraryDto? library$,
    SystemConfigLoggingDto? logging,
    SystemConfigMachineLearningDto? machineLearning,
    SystemConfigMapDto? map,
    SystemConfigMetadataDto? metadata,
    SystemConfigNewVersionCheckDto? newVersionCheck,
    SystemConfigNightlyTasksDto? nightlyTasks,
    SystemConfigNotificationsDto? notifications,
    SystemConfigOAuthDto? oauth,
    SystemConfigPasswordLoginDto? passwordLogin,
    SystemConfigReverseGeocodingDto? reverseGeocoding,
    SystemConfigServerDto? server,
    SystemConfigStorageTemplateDto? storageTemplate,
    SystemConfigTemplatesDto? templates,
    SystemConfigThemeDto? theme,
    SystemConfigTrashDto? trash,
    SystemConfigUserDto? user,
  }) {
    return .new(
      backup: backup ?? this.backup,
      ffmpeg: ffmpeg ?? this.ffmpeg,
      image: image ?? this.image,
      job: job ?? this.job,
      library$: library$ ?? this.library$,
      logging: logging ?? this.logging,
      machineLearning: machineLearning ?? this.machineLearning,
      map: map ?? this.map,
      metadata: metadata ?? this.metadata,
      newVersionCheck: newVersionCheck ?? this.newVersionCheck,
      nightlyTasks: nightlyTasks ?? this.nightlyTasks,
      notifications: notifications ?? this.notifications,
      oauth: oauth ?? this.oauth,
      passwordLogin: passwordLogin ?? this.passwordLogin,
      reverseGeocoding: reverseGeocoding ?? this.reverseGeocoding,
      server: server ?? this.server,
      storageTemplate: storageTemplate ?? this.storageTemplate,
      templates: templates ?? this.templates,
      theme: theme ?? this.theme,
      trash: trash ?? this.trash,
      user: user ?? this.user,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigDto &&
            backup == other.backup &&
            ffmpeg == other.ffmpeg &&
            image == other.image &&
            job == other.job &&
            library$ == other.library$ &&
            logging == other.logging &&
            machineLearning == other.machineLearning &&
            map == other.map &&
            metadata == other.metadata &&
            newVersionCheck == other.newVersionCheck &&
            nightlyTasks == other.nightlyTasks &&
            notifications == other.notifications &&
            oauth == other.oauth &&
            passwordLogin == other.passwordLogin &&
            reverseGeocoding == other.reverseGeocoding &&
            server == other.server &&
            storageTemplate == other.storageTemplate &&
            templates == other.templates &&
            theme == other.theme &&
            trash == other.trash &&
            user == other.user);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      backup,
      ffmpeg,
      image,
      job,
      library$,
      logging,
      machineLearning,
      map,
      metadata,
      newVersionCheck,
      nightlyTasks,
      notifications,
      oauth,
      passwordLogin,
      reverseGeocoding,
      server,
      storageTemplate,
      templates,
      theme,
      trash,
      user,
    ]);
  }

  @override
  String toString() =>
      'SystemConfigDto(backup=$backup, ffmpeg=$ffmpeg, image=$image, job=$job, library\$=${library$}, logging=$logging, machineLearning=$machineLearning, map=$map, metadata=$metadata, newVersionCheck=$newVersionCheck, nightlyTasks=$nightlyTasks, notifications=$notifications, oauth=$oauth, passwordLogin=$passwordLogin, reverseGeocoding=$reverseGeocoding, server=$server, storageTemplate=$storageTemplate, templates=$templates, theme=$theme, trash=$trash, user=$user)';
}

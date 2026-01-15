//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigJobDto {
  /// Returns a new [SystemConfigJobDto] instance.
  SystemConfigJobDto({
    required this.assetThumbnailGeneration,
    required this.backgroundTask,
    required this.encryption,
    required this.faceDetection,
    required this.library_,
    required this.metadataExtraction,
    required this.migration,
    required this.notifications,
    required this.ocr,
    required this.personThumbnailGeneration,
    required this.s3Upload,
    required this.search,
    required this.sidecar,
    required this.smartSearch,
    required this.videoConversion,
    required this.workflow,
  });

  JobSettingsDto assetThumbnailGeneration;

  JobSettingsDto backgroundTask;

  JobSettingsDto encryption;

  JobSettingsDto faceDetection;

  JobSettingsDto library_;

  JobSettingsDto metadataExtraction;

  JobSettingsDto migration;

  JobSettingsDto notifications;

  JobSettingsDto ocr;

  JobSettingsDto personThumbnailGeneration;

  JobSettingsDto s3Upload;

  JobSettingsDto search;

  JobSettingsDto sidecar;

  JobSettingsDto smartSearch;

  JobSettingsDto videoConversion;

  JobSettingsDto workflow;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigJobDto &&
    other.assetThumbnailGeneration == assetThumbnailGeneration &&
    other.backgroundTask == backgroundTask &&
    other.encryption == encryption &&
    other.faceDetection == faceDetection &&
    other.library_ == library_ &&
    other.metadataExtraction == metadataExtraction &&
    other.migration == migration &&
    other.notifications == notifications &&
    other.ocr == ocr &&
    other.personThumbnailGeneration == personThumbnailGeneration &&
    other.s3Upload == s3Upload &&
    other.search == search &&
    other.sidecar == sidecar &&
    other.smartSearch == smartSearch &&
    other.videoConversion == videoConversion &&
    other.workflow == workflow;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetThumbnailGeneration.hashCode) +
    (backgroundTask.hashCode) +
    (encryption.hashCode) +
    (faceDetection.hashCode) +
    (library_.hashCode) +
    (metadataExtraction.hashCode) +
    (migration.hashCode) +
    (notifications.hashCode) +
    (ocr.hashCode) +
    (personThumbnailGeneration.hashCode) +
    (s3Upload.hashCode) +
    (search.hashCode) +
    (sidecar.hashCode) +
    (smartSearch.hashCode) +
    (videoConversion.hashCode) +
    (workflow.hashCode);

  @override
  String toString() => 'SystemConfigJobDto[assetThumbnailGeneration=$assetThumbnailGeneration, backgroundTask=$backgroundTask, encryption=$encryption, faceDetection=$faceDetection, library_=$library_, metadataExtraction=$metadataExtraction, migration=$migration, notifications=$notifications, ocr=$ocr, personThumbnailGeneration=$personThumbnailGeneration, s3Upload=$s3Upload, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, videoConversion=$videoConversion, workflow=$workflow]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetThumbnailGeneration'] = this.assetThumbnailGeneration;
      json[r'backgroundTask'] = this.backgroundTask;
      json[r'encryption'] = this.encryption;
      json[r'faceDetection'] = this.faceDetection;
      json[r'library'] = this.library_;
      json[r'metadataExtraction'] = this.metadataExtraction;
      json[r'migration'] = this.migration;
      json[r'notifications'] = this.notifications;
      json[r'ocr'] = this.ocr;
      json[r'personThumbnailGeneration'] = this.personThumbnailGeneration;
      json[r's3Upload'] = this.s3Upload;
      json[r'search'] = this.search;
      json[r'sidecar'] = this.sidecar;
      json[r'smartSearch'] = this.smartSearch;
      json[r'videoConversion'] = this.videoConversion;
      json[r'workflow'] = this.workflow;
    return json;
  }

  /// Returns a new [SystemConfigJobDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigJobDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigJobDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigJobDto(
        assetThumbnailGeneration: JobSettingsDto.fromJson(json[r'assetThumbnailGeneration'])!,
        backgroundTask: JobSettingsDto.fromJson(json[r'backgroundTask'])!,
        encryption: JobSettingsDto.fromJson(json[r'encryption'])!,
        faceDetection: JobSettingsDto.fromJson(json[r'faceDetection'])!,
        library_: JobSettingsDto.fromJson(json[r'library'])!,
        metadataExtraction: JobSettingsDto.fromJson(json[r'metadataExtraction'])!,
        migration: JobSettingsDto.fromJson(json[r'migration'])!,
        notifications: JobSettingsDto.fromJson(json[r'notifications'])!,
        ocr: JobSettingsDto.fromJson(json[r'ocr'])!,
        personThumbnailGeneration: JobSettingsDto.fromJson(json[r'personThumbnailGeneration'])!,
        s3Upload: JobSettingsDto.fromJson(json[r's3Upload'])!,
        search: JobSettingsDto.fromJson(json[r'search'])!,
        sidecar: JobSettingsDto.fromJson(json[r'sidecar'])!,
        smartSearch: JobSettingsDto.fromJson(json[r'smartSearch'])!,
        videoConversion: JobSettingsDto.fromJson(json[r'videoConversion'])!,
        workflow: JobSettingsDto.fromJson(json[r'workflow'])!,
      );
    }
    return null;
  }

  static List<SystemConfigJobDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigJobDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigJobDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigJobDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigJobDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigJobDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigJobDto-objects as value to a dart map
  static Map<String, List<SystemConfigJobDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigJobDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigJobDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetThumbnailGeneration',
    'backgroundTask',
    'encryption',
    'faceDetection',
    'library',
    'metadataExtraction',
    'migration',
    'notifications',
    'ocr',
    'personThumbnailGeneration',
    's3Upload',
    'search',
    'sidecar',
    'smartSearch',
    'videoConversion',
    'workflow',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class QueuesResponseLegacyDto {
  /// Returns a new [QueuesResponseLegacyDto] instance.
  QueuesResponseLegacyDto({
    required this.assetThumbnailGeneration,
    required this.backgroundTask,
    required this.backupDatabase,
    required this.duplicateDetection,
    required this.encryption,
    required this.faceDetection,
    required this.facialRecognition,
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
    required this.storageTemplateMigration,
    required this.videoConversion,
    required this.workflow,
  });

  QueueResponseLegacyDto assetThumbnailGeneration;

  QueueResponseLegacyDto backgroundTask;

  QueueResponseLegacyDto backupDatabase;

  QueueResponseLegacyDto duplicateDetection;

  QueueResponseLegacyDto encryption;

  QueueResponseLegacyDto faceDetection;

  QueueResponseLegacyDto facialRecognition;

  QueueResponseLegacyDto library_;

  QueueResponseLegacyDto metadataExtraction;

  QueueResponseLegacyDto migration;

  QueueResponseLegacyDto notifications;

  QueueResponseLegacyDto ocr;

  QueueResponseLegacyDto personThumbnailGeneration;

  QueueResponseLegacyDto s3Upload;

  QueueResponseLegacyDto search;

  QueueResponseLegacyDto sidecar;

  QueueResponseLegacyDto smartSearch;

  QueueResponseLegacyDto storageTemplateMigration;

  QueueResponseLegacyDto videoConversion;

  QueueResponseLegacyDto workflow;

  @override
  bool operator ==(Object other) => identical(this, other) || other is QueuesResponseLegacyDto &&
    other.assetThumbnailGeneration == assetThumbnailGeneration &&
    other.backgroundTask == backgroundTask &&
    other.backupDatabase == backupDatabase &&
    other.duplicateDetection == duplicateDetection &&
    other.encryption == encryption &&
    other.faceDetection == faceDetection &&
    other.facialRecognition == facialRecognition &&
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
    other.storageTemplateMigration == storageTemplateMigration &&
    other.videoConversion == videoConversion &&
    other.workflow == workflow;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetThumbnailGeneration.hashCode) +
    (backgroundTask.hashCode) +
    (backupDatabase.hashCode) +
    (duplicateDetection.hashCode) +
    (encryption.hashCode) +
    (faceDetection.hashCode) +
    (facialRecognition.hashCode) +
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
    (storageTemplateMigration.hashCode) +
    (videoConversion.hashCode) +
    (workflow.hashCode);

  @override
  String toString() => 'QueuesResponseLegacyDto[assetThumbnailGeneration=$assetThumbnailGeneration, backgroundTask=$backgroundTask, backupDatabase=$backupDatabase, duplicateDetection=$duplicateDetection, encryption=$encryption, faceDetection=$faceDetection, facialRecognition=$facialRecognition, library_=$library_, metadataExtraction=$metadataExtraction, migration=$migration, notifications=$notifications, ocr=$ocr, personThumbnailGeneration=$personThumbnailGeneration, s3Upload=$s3Upload, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, storageTemplateMigration=$storageTemplateMigration, videoConversion=$videoConversion, workflow=$workflow]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetThumbnailGeneration'] = this.assetThumbnailGeneration;
      json[r'backgroundTask'] = this.backgroundTask;
      json[r'backupDatabase'] = this.backupDatabase;
      json[r'duplicateDetection'] = this.duplicateDetection;
      json[r'encryption'] = this.encryption;
      json[r'faceDetection'] = this.faceDetection;
      json[r'facialRecognition'] = this.facialRecognition;
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
      json[r'storageTemplateMigration'] = this.storageTemplateMigration;
      json[r'videoConversion'] = this.videoConversion;
      json[r'workflow'] = this.workflow;
    return json;
  }

  /// Returns a new [QueuesResponseLegacyDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static QueuesResponseLegacyDto? fromJson(dynamic value) {
    upgradeDto(value, "QueuesResponseLegacyDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return QueuesResponseLegacyDto(
        assetThumbnailGeneration: QueueResponseLegacyDto.fromJson(json[r'assetThumbnailGeneration'])!,
        backgroundTask: QueueResponseLegacyDto.fromJson(json[r'backgroundTask'])!,
        backupDatabase: QueueResponseLegacyDto.fromJson(json[r'backupDatabase'])!,
        duplicateDetection: QueueResponseLegacyDto.fromJson(json[r'duplicateDetection'])!,
        encryption: QueueResponseLegacyDto.fromJson(json[r'encryption'])!,
        faceDetection: QueueResponseLegacyDto.fromJson(json[r'faceDetection'])!,
        facialRecognition: QueueResponseLegacyDto.fromJson(json[r'facialRecognition'])!,
        library_: QueueResponseLegacyDto.fromJson(json[r'library'])!,
        metadataExtraction: QueueResponseLegacyDto.fromJson(json[r'metadataExtraction'])!,
        migration: QueueResponseLegacyDto.fromJson(json[r'migration'])!,
        notifications: QueueResponseLegacyDto.fromJson(json[r'notifications'])!,
        ocr: QueueResponseLegacyDto.fromJson(json[r'ocr'])!,
        personThumbnailGeneration: QueueResponseLegacyDto.fromJson(json[r'personThumbnailGeneration'])!,
        s3Upload: QueueResponseLegacyDto.fromJson(json[r's3Upload'])!,
        search: QueueResponseLegacyDto.fromJson(json[r'search'])!,
        sidecar: QueueResponseLegacyDto.fromJson(json[r'sidecar'])!,
        smartSearch: QueueResponseLegacyDto.fromJson(json[r'smartSearch'])!,
        storageTemplateMigration: QueueResponseLegacyDto.fromJson(json[r'storageTemplateMigration'])!,
        videoConversion: QueueResponseLegacyDto.fromJson(json[r'videoConversion'])!,
        workflow: QueueResponseLegacyDto.fromJson(json[r'workflow'])!,
      );
    }
    return null;
  }

  static List<QueuesResponseLegacyDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueuesResponseLegacyDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueuesResponseLegacyDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, QueuesResponseLegacyDto> mapFromJson(dynamic json) {
    final map = <String, QueuesResponseLegacyDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = QueuesResponseLegacyDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of QueuesResponseLegacyDto-objects as value to a dart map
  static Map<String, List<QueuesResponseLegacyDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<QueuesResponseLegacyDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = QueuesResponseLegacyDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetThumbnailGeneration',
    'backgroundTask',
    'backupDatabase',
    'duplicateDetection',
    'encryption',
    'faceDetection',
    'facialRecognition',
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
    'storageTemplateMigration',
    'videoConversion',
    'workflow',
  };
}


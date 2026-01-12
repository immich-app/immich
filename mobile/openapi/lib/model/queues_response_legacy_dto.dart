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
    required this.backgroundTask,
    required this.backupDatabase,
    required this.duplicateDetection,
    required this.faceDetection,
    required this.facialRecognition,
    required this.library_,
    required this.metadataExtraction,
    required this.migration,
    required this.notifications,
    required this.ocr,
    required this.search,
    required this.sidecar,
    required this.smartSearch,
    required this.storageTemplateMigration,
    required this.thumbnailGeneration,
    required this.videoConversion,
    required this.workflow,
  });

  QueueResponseLegacyDto backgroundTask;

  QueueResponseLegacyDto backupDatabase;

  QueueResponseLegacyDto duplicateDetection;

  QueueResponseLegacyDto faceDetection;

  QueueResponseLegacyDto facialRecognition;

  QueueResponseLegacyDto library_;

  QueueResponseLegacyDto metadataExtraction;

  QueueResponseLegacyDto migration;

  QueueResponseLegacyDto notifications;

  QueueResponseLegacyDto ocr;

  QueueResponseLegacyDto search;

  QueueResponseLegacyDto sidecar;

  QueueResponseLegacyDto smartSearch;

  QueueResponseLegacyDto storageTemplateMigration;

  QueueResponseLegacyDto thumbnailGeneration;

  QueueResponseLegacyDto videoConversion;

  QueueResponseLegacyDto workflow;

  @override
  bool operator ==(Object other) => identical(this, other) || other is QueuesResponseLegacyDto &&
    other.backgroundTask == backgroundTask &&
    other.backupDatabase == backupDatabase &&
    other.duplicateDetection == duplicateDetection &&
    other.faceDetection == faceDetection &&
    other.facialRecognition == facialRecognition &&
    other.library_ == library_ &&
    other.metadataExtraction == metadataExtraction &&
    other.migration == migration &&
    other.notifications == notifications &&
    other.ocr == ocr &&
    other.search == search &&
    other.sidecar == sidecar &&
    other.smartSearch == smartSearch &&
    other.storageTemplateMigration == storageTemplateMigration &&
    other.thumbnailGeneration == thumbnailGeneration &&
    other.videoConversion == videoConversion &&
    other.workflow == workflow;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backgroundTask.hashCode) +
    (backupDatabase.hashCode) +
    (duplicateDetection.hashCode) +
    (faceDetection.hashCode) +
    (facialRecognition.hashCode) +
    (library_.hashCode) +
    (metadataExtraction.hashCode) +
    (migration.hashCode) +
    (notifications.hashCode) +
    (ocr.hashCode) +
    (search.hashCode) +
    (sidecar.hashCode) +
    (smartSearch.hashCode) +
    (storageTemplateMigration.hashCode) +
    (thumbnailGeneration.hashCode) +
    (videoConversion.hashCode) +
    (workflow.hashCode);

  @override
  String toString() => 'QueuesResponseLegacyDto[backgroundTask=$backgroundTask, backupDatabase=$backupDatabase, duplicateDetection=$duplicateDetection, faceDetection=$faceDetection, facialRecognition=$facialRecognition, library_=$library_, metadataExtraction=$metadataExtraction, migration=$migration, notifications=$notifications, ocr=$ocr, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, storageTemplateMigration=$storageTemplateMigration, thumbnailGeneration=$thumbnailGeneration, videoConversion=$videoConversion, workflow=$workflow]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backgroundTask'] = this.backgroundTask;
      json[r'backupDatabase'] = this.backupDatabase;
      json[r'duplicateDetection'] = this.duplicateDetection;
      json[r'faceDetection'] = this.faceDetection;
      json[r'facialRecognition'] = this.facialRecognition;
      json[r'library'] = this.library_;
      json[r'metadataExtraction'] = this.metadataExtraction;
      json[r'migration'] = this.migration;
      json[r'notifications'] = this.notifications;
      json[r'ocr'] = this.ocr;
      json[r'search'] = this.search;
      json[r'sidecar'] = this.sidecar;
      json[r'smartSearch'] = this.smartSearch;
      json[r'storageTemplateMigration'] = this.storageTemplateMigration;
      json[r'thumbnailGeneration'] = this.thumbnailGeneration;
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
        backgroundTask: QueueResponseLegacyDto.fromJson(json[r'backgroundTask'])!,
        backupDatabase: QueueResponseLegacyDto.fromJson(json[r'backupDatabase'])!,
        duplicateDetection: QueueResponseLegacyDto.fromJson(json[r'duplicateDetection'])!,
        faceDetection: QueueResponseLegacyDto.fromJson(json[r'faceDetection'])!,
        facialRecognition: QueueResponseLegacyDto.fromJson(json[r'facialRecognition'])!,
        library_: QueueResponseLegacyDto.fromJson(json[r'library'])!,
        metadataExtraction: QueueResponseLegacyDto.fromJson(json[r'metadataExtraction'])!,
        migration: QueueResponseLegacyDto.fromJson(json[r'migration'])!,
        notifications: QueueResponseLegacyDto.fromJson(json[r'notifications'])!,
        ocr: QueueResponseLegacyDto.fromJson(json[r'ocr'])!,
        search: QueueResponseLegacyDto.fromJson(json[r'search'])!,
        sidecar: QueueResponseLegacyDto.fromJson(json[r'sidecar'])!,
        smartSearch: QueueResponseLegacyDto.fromJson(json[r'smartSearch'])!,
        storageTemplateMigration: QueueResponseLegacyDto.fromJson(json[r'storageTemplateMigration'])!,
        thumbnailGeneration: QueueResponseLegacyDto.fromJson(json[r'thumbnailGeneration'])!,
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
    'backgroundTask',
    'backupDatabase',
    'duplicateDetection',
    'faceDetection',
    'facialRecognition',
    'library',
    'metadataExtraction',
    'migration',
    'notifications',
    'ocr',
    'search',
    'sidecar',
    'smartSearch',
    'storageTemplateMigration',
    'thumbnailGeneration',
    'videoConversion',
    'workflow',
  };
}


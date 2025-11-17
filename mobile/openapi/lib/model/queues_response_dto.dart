//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class QueuesResponseDto {
  /// Returns a new [QueuesResponseDto] instance.
  QueuesResponseDto({
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

  QueueResponseDto backgroundTask;

  QueueResponseDto backupDatabase;

  QueueResponseDto duplicateDetection;

  QueueResponseDto faceDetection;

  QueueResponseDto facialRecognition;

  QueueResponseDto library_;

  QueueResponseDto metadataExtraction;

  QueueResponseDto migration;

  QueueResponseDto notifications;

  QueueResponseDto ocr;

  QueueResponseDto search;

  QueueResponseDto sidecar;

  QueueResponseDto smartSearch;

  QueueResponseDto storageTemplateMigration;

  QueueResponseDto thumbnailGeneration;

  QueueResponseDto videoConversion;

  QueueResponseDto workflow;

  @override
  bool operator ==(Object other) => identical(this, other) || other is QueuesResponseDto &&
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
  String toString() => 'QueuesResponseDto[backgroundTask=$backgroundTask, backupDatabase=$backupDatabase, duplicateDetection=$duplicateDetection, faceDetection=$faceDetection, facialRecognition=$facialRecognition, library_=$library_, metadataExtraction=$metadataExtraction, migration=$migration, notifications=$notifications, ocr=$ocr, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, storageTemplateMigration=$storageTemplateMigration, thumbnailGeneration=$thumbnailGeneration, videoConversion=$videoConversion, workflow=$workflow]';

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

  /// Returns a new [QueuesResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static QueuesResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "QueuesResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return QueuesResponseDto(
        backgroundTask: QueueResponseDto.fromJson(json[r'backgroundTask'])!,
        backupDatabase: QueueResponseDto.fromJson(json[r'backupDatabase'])!,
        duplicateDetection: QueueResponseDto.fromJson(json[r'duplicateDetection'])!,
        faceDetection: QueueResponseDto.fromJson(json[r'faceDetection'])!,
        facialRecognition: QueueResponseDto.fromJson(json[r'facialRecognition'])!,
        library_: QueueResponseDto.fromJson(json[r'library'])!,
        metadataExtraction: QueueResponseDto.fromJson(json[r'metadataExtraction'])!,
        migration: QueueResponseDto.fromJson(json[r'migration'])!,
        notifications: QueueResponseDto.fromJson(json[r'notifications'])!,
        ocr: QueueResponseDto.fromJson(json[r'ocr'])!,
        search: QueueResponseDto.fromJson(json[r'search'])!,
        sidecar: QueueResponseDto.fromJson(json[r'sidecar'])!,
        smartSearch: QueueResponseDto.fromJson(json[r'smartSearch'])!,
        storageTemplateMigration: QueueResponseDto.fromJson(json[r'storageTemplateMigration'])!,
        thumbnailGeneration: QueueResponseDto.fromJson(json[r'thumbnailGeneration'])!,
        videoConversion: QueueResponseDto.fromJson(json[r'videoConversion'])!,
        workflow: QueueResponseDto.fromJson(json[r'workflow'])!,
      );
    }
    return null;
  }

  static List<QueuesResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueuesResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueuesResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, QueuesResponseDto> mapFromJson(dynamic json) {
    final map = <String, QueuesResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = QueuesResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of QueuesResponseDto-objects as value to a dart map
  static Map<String, List<QueuesResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<QueuesResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = QueuesResponseDto.listFromJson(entry.value, growable: growable,);
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


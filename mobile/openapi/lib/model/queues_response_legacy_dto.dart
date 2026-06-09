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
    required this.editor,
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

  QueueResponseLegacyDto editor;

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
    other.editor == editor &&
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
    (editor.hashCode) +
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
  String toString() => 'QueuesResponseLegacyDto[backgroundTask=$backgroundTask, backupDatabase=$backupDatabase, duplicateDetection=$duplicateDetection, editor=$editor, faceDetection=$faceDetection, facialRecognition=$facialRecognition, library_=$library_, metadataExtraction=$metadataExtraction, migration=$migration, notifications=$notifications, ocr=$ocr, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, storageTemplateMigration=$storageTemplateMigration, thumbnailGeneration=$thumbnailGeneration, videoConversion=$videoConversion, workflow=$workflow]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backgroundTask'] = this.backgroundTask;
      json[r'backupDatabase'] = this.backupDatabase;
      json[r'duplicateDetection'] = this.duplicateDetection;
      json[r'editor'] = this.editor;
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
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'backgroundTask'), 'Required key "QueuesResponseLegacyDto[backgroundTask]" is missing from JSON.');
        assert(json[r'backgroundTask'] != null, 'Required key "QueuesResponseLegacyDto[backgroundTask]" has a null value in JSON.');
        assert(json.containsKey(r'backupDatabase'), 'Required key "QueuesResponseLegacyDto[backupDatabase]" is missing from JSON.');
        assert(json[r'backupDatabase'] != null, 'Required key "QueuesResponseLegacyDto[backupDatabase]" has a null value in JSON.');
        assert(json.containsKey(r'duplicateDetection'), 'Required key "QueuesResponseLegacyDto[duplicateDetection]" is missing from JSON.');
        assert(json[r'duplicateDetection'] != null, 'Required key "QueuesResponseLegacyDto[duplicateDetection]" has a null value in JSON.');
        assert(json.containsKey(r'editor'), 'Required key "QueuesResponseLegacyDto[editor]" is missing from JSON.');
        assert(json[r'editor'] != null, 'Required key "QueuesResponseLegacyDto[editor]" has a null value in JSON.');
        assert(json.containsKey(r'faceDetection'), 'Required key "QueuesResponseLegacyDto[faceDetection]" is missing from JSON.');
        assert(json[r'faceDetection'] != null, 'Required key "QueuesResponseLegacyDto[faceDetection]" has a null value in JSON.');
        assert(json.containsKey(r'facialRecognition'), 'Required key "QueuesResponseLegacyDto[facialRecognition]" is missing from JSON.');
        assert(json[r'facialRecognition'] != null, 'Required key "QueuesResponseLegacyDto[facialRecognition]" has a null value in JSON.');
        assert(json.containsKey(r'library'), 'Required key "QueuesResponseLegacyDto[library]" is missing from JSON.');
        assert(json[r'library'] != null, 'Required key "QueuesResponseLegacyDto[library]" has a null value in JSON.');
        assert(json.containsKey(r'metadataExtraction'), 'Required key "QueuesResponseLegacyDto[metadataExtraction]" is missing from JSON.');
        assert(json[r'metadataExtraction'] != null, 'Required key "QueuesResponseLegacyDto[metadataExtraction]" has a null value in JSON.');
        assert(json.containsKey(r'migration'), 'Required key "QueuesResponseLegacyDto[migration]" is missing from JSON.');
        assert(json[r'migration'] != null, 'Required key "QueuesResponseLegacyDto[migration]" has a null value in JSON.');
        assert(json.containsKey(r'notifications'), 'Required key "QueuesResponseLegacyDto[notifications]" is missing from JSON.');
        assert(json[r'notifications'] != null, 'Required key "QueuesResponseLegacyDto[notifications]" has a null value in JSON.');
        assert(json.containsKey(r'ocr'), 'Required key "QueuesResponseLegacyDto[ocr]" is missing from JSON.');
        assert(json[r'ocr'] != null, 'Required key "QueuesResponseLegacyDto[ocr]" has a null value in JSON.');
        assert(json.containsKey(r'search'), 'Required key "QueuesResponseLegacyDto[search]" is missing from JSON.');
        assert(json[r'search'] != null, 'Required key "QueuesResponseLegacyDto[search]" has a null value in JSON.');
        assert(json.containsKey(r'sidecar'), 'Required key "QueuesResponseLegacyDto[sidecar]" is missing from JSON.');
        assert(json[r'sidecar'] != null, 'Required key "QueuesResponseLegacyDto[sidecar]" has a null value in JSON.');
        assert(json.containsKey(r'smartSearch'), 'Required key "QueuesResponseLegacyDto[smartSearch]" is missing from JSON.');
        assert(json[r'smartSearch'] != null, 'Required key "QueuesResponseLegacyDto[smartSearch]" has a null value in JSON.');
        assert(json.containsKey(r'storageTemplateMigration'), 'Required key "QueuesResponseLegacyDto[storageTemplateMigration]" is missing from JSON.');
        assert(json[r'storageTemplateMigration'] != null, 'Required key "QueuesResponseLegacyDto[storageTemplateMigration]" has a null value in JSON.');
        assert(json.containsKey(r'thumbnailGeneration'), 'Required key "QueuesResponseLegacyDto[thumbnailGeneration]" is missing from JSON.');
        assert(json[r'thumbnailGeneration'] != null, 'Required key "QueuesResponseLegacyDto[thumbnailGeneration]" has a null value in JSON.');
        assert(json.containsKey(r'videoConversion'), 'Required key "QueuesResponseLegacyDto[videoConversion]" is missing from JSON.');
        assert(json[r'videoConversion'] != null, 'Required key "QueuesResponseLegacyDto[videoConversion]" has a null value in JSON.');
        assert(json.containsKey(r'workflow'), 'Required key "QueuesResponseLegacyDto[workflow]" is missing from JSON.');
        assert(json[r'workflow'] != null, 'Required key "QueuesResponseLegacyDto[workflow]" has a null value in JSON.');
        return true;
      }());

      return QueuesResponseLegacyDto(
        backgroundTask: QueueResponseLegacyDto.fromJson(json[r'backgroundTask'])!,
        backupDatabase: QueueResponseLegacyDto.fromJson(json[r'backupDatabase'])!,
        duplicateDetection: QueueResponseLegacyDto.fromJson(json[r'duplicateDetection'])!,
        editor: QueueResponseLegacyDto.fromJson(json[r'editor'])!,
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
    'editor',
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


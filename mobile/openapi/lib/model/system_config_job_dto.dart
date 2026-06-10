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
    required this.backgroundTask,
    required this.editor,
    required this.faceDetection,
    required this.library_,
    required this.metadataExtraction,
    required this.migration,
    required this.notifications,
    required this.ocr,
    required this.search,
    required this.sidecar,
    required this.smartSearch,
    required this.thumbnailGeneration,
    required this.videoConversion,
    required this.workflow,
  });

  JobSettingsDto backgroundTask;

  JobSettingsDto editor;

  JobSettingsDto faceDetection;

  JobSettingsDto library_;

  JobSettingsDto metadataExtraction;

  JobSettingsDto migration;

  JobSettingsDto notifications;

  JobSettingsDto ocr;

  JobSettingsDto search;

  JobSettingsDto sidecar;

  JobSettingsDto smartSearch;

  JobSettingsDto thumbnailGeneration;

  JobSettingsDto videoConversion;

  JobSettingsDto workflow;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigJobDto &&
    other.backgroundTask == backgroundTask &&
    other.editor == editor &&
    other.faceDetection == faceDetection &&
    other.library_ == library_ &&
    other.metadataExtraction == metadataExtraction &&
    other.migration == migration &&
    other.notifications == notifications &&
    other.ocr == ocr &&
    other.search == search &&
    other.sidecar == sidecar &&
    other.smartSearch == smartSearch &&
    other.thumbnailGeneration == thumbnailGeneration &&
    other.videoConversion == videoConversion &&
    other.workflow == workflow;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backgroundTask.hashCode) +
    (editor.hashCode) +
    (faceDetection.hashCode) +
    (library_.hashCode) +
    (metadataExtraction.hashCode) +
    (migration.hashCode) +
    (notifications.hashCode) +
    (ocr.hashCode) +
    (search.hashCode) +
    (sidecar.hashCode) +
    (smartSearch.hashCode) +
    (thumbnailGeneration.hashCode) +
    (videoConversion.hashCode) +
    (workflow.hashCode);

  @override
  String toString() => 'SystemConfigJobDto[backgroundTask=$backgroundTask, editor=$editor, faceDetection=$faceDetection, library_=$library_, metadataExtraction=$metadataExtraction, migration=$migration, notifications=$notifications, ocr=$ocr, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, thumbnailGeneration=$thumbnailGeneration, videoConversion=$videoConversion, workflow=$workflow]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backgroundTask'] = this.backgroundTask;
      json[r'editor'] = this.editor;
      json[r'faceDetection'] = this.faceDetection;
      json[r'library'] = this.library_;
      json[r'metadataExtraction'] = this.metadataExtraction;
      json[r'migration'] = this.migration;
      json[r'notifications'] = this.notifications;
      json[r'ocr'] = this.ocr;
      json[r'search'] = this.search;
      json[r'sidecar'] = this.sidecar;
      json[r'smartSearch'] = this.smartSearch;
      json[r'thumbnailGeneration'] = this.thumbnailGeneration;
      json[r'videoConversion'] = this.videoConversion;
      json[r'workflow'] = this.workflow;
    return json;
  }

  /// Returns a new [SystemConfigJobDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigJobDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'backgroundTask'), 'Required key "SystemConfigJobDto[backgroundTask]" is missing from JSON.');
        assert(json[r'backgroundTask'] != null, 'Required key "SystemConfigJobDto[backgroundTask]" has a null value in JSON.');
        assert(json.containsKey(r'editor'), 'Required key "SystemConfigJobDto[editor]" is missing from JSON.');
        assert(json[r'editor'] != null, 'Required key "SystemConfigJobDto[editor]" has a null value in JSON.');
        assert(json.containsKey(r'faceDetection'), 'Required key "SystemConfigJobDto[faceDetection]" is missing from JSON.');
        assert(json[r'faceDetection'] != null, 'Required key "SystemConfigJobDto[faceDetection]" has a null value in JSON.');
        assert(json.containsKey(r'library'), 'Required key "SystemConfigJobDto[library]" is missing from JSON.');
        assert(json[r'library'] != null, 'Required key "SystemConfigJobDto[library]" has a null value in JSON.');
        assert(json.containsKey(r'metadataExtraction'), 'Required key "SystemConfigJobDto[metadataExtraction]" is missing from JSON.');
        assert(json[r'metadataExtraction'] != null, 'Required key "SystemConfigJobDto[metadataExtraction]" has a null value in JSON.');
        assert(json.containsKey(r'migration'), 'Required key "SystemConfigJobDto[migration]" is missing from JSON.');
        assert(json[r'migration'] != null, 'Required key "SystemConfigJobDto[migration]" has a null value in JSON.');
        assert(json.containsKey(r'notifications'), 'Required key "SystemConfigJobDto[notifications]" is missing from JSON.');
        assert(json[r'notifications'] != null, 'Required key "SystemConfigJobDto[notifications]" has a null value in JSON.');
        assert(json.containsKey(r'ocr'), 'Required key "SystemConfigJobDto[ocr]" is missing from JSON.');
        assert(json[r'ocr'] != null, 'Required key "SystemConfigJobDto[ocr]" has a null value in JSON.');
        assert(json.containsKey(r'search'), 'Required key "SystemConfigJobDto[search]" is missing from JSON.');
        assert(json[r'search'] != null, 'Required key "SystemConfigJobDto[search]" has a null value in JSON.');
        assert(json.containsKey(r'sidecar'), 'Required key "SystemConfigJobDto[sidecar]" is missing from JSON.');
        assert(json[r'sidecar'] != null, 'Required key "SystemConfigJobDto[sidecar]" has a null value in JSON.');
        assert(json.containsKey(r'smartSearch'), 'Required key "SystemConfigJobDto[smartSearch]" is missing from JSON.');
        assert(json[r'smartSearch'] != null, 'Required key "SystemConfigJobDto[smartSearch]" has a null value in JSON.');
        assert(json.containsKey(r'thumbnailGeneration'), 'Required key "SystemConfigJobDto[thumbnailGeneration]" is missing from JSON.');
        assert(json[r'thumbnailGeneration'] != null, 'Required key "SystemConfigJobDto[thumbnailGeneration]" has a null value in JSON.');
        assert(json.containsKey(r'videoConversion'), 'Required key "SystemConfigJobDto[videoConversion]" is missing from JSON.');
        assert(json[r'videoConversion'] != null, 'Required key "SystemConfigJobDto[videoConversion]" has a null value in JSON.');
        assert(json.containsKey(r'workflow'), 'Required key "SystemConfigJobDto[workflow]" is missing from JSON.');
        assert(json[r'workflow'] != null, 'Required key "SystemConfigJobDto[workflow]" has a null value in JSON.');
        return true;
      }());

      return SystemConfigJobDto(
        backgroundTask: JobSettingsDto.fromJson(json[r'backgroundTask'])!,
        editor: JobSettingsDto.fromJson(json[r'editor'])!,
        faceDetection: JobSettingsDto.fromJson(json[r'faceDetection'])!,
        library_: JobSettingsDto.fromJson(json[r'library'])!,
        metadataExtraction: JobSettingsDto.fromJson(json[r'metadataExtraction'])!,
        migration: JobSettingsDto.fromJson(json[r'migration'])!,
        notifications: JobSettingsDto.fromJson(json[r'notifications'])!,
        ocr: JobSettingsDto.fromJson(json[r'ocr'])!,
        search: JobSettingsDto.fromJson(json[r'search'])!,
        sidecar: JobSettingsDto.fromJson(json[r'sidecar'])!,
        smartSearch: JobSettingsDto.fromJson(json[r'smartSearch'])!,
        thumbnailGeneration: JobSettingsDto.fromJson(json[r'thumbnailGeneration'])!,
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
    'backgroundTask',
    'editor',
    'faceDetection',
    'library',
    'metadataExtraction',
    'migration',
    'notifications',
    'ocr',
    'search',
    'sidecar',
    'smartSearch',
    'thumbnailGeneration',
    'videoConversion',
    'workflow',
  };
}


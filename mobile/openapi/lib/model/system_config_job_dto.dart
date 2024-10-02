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
    required this.faceDetection,
    required this.library_,
    required this.metadataExtraction,
    required this.migration,
    required this.notifications,
    required this.search,
    required this.sidecar,
    required this.smartSearch,
    required this.thumbnailGeneration,
    required this.videoConversion,
  });

  JobSettingsDto backgroundTask;

  JobSettingsDto faceDetection;

  JobSettingsDto library_;

  JobSettingsDto metadataExtraction;

  JobSettingsDto migration;

  JobSettingsDto notifications;

  JobSettingsDto search;

  JobSettingsDto sidecar;

  JobSettingsDto smartSearch;

  JobSettingsDto thumbnailGeneration;

  JobSettingsDto videoConversion;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigJobDto &&
    other.backgroundTask == backgroundTask &&
    other.faceDetection == faceDetection &&
    other.library_ == library_ &&
    other.metadataExtraction == metadataExtraction &&
    other.migration == migration &&
    other.notifications == notifications &&
    other.search == search &&
    other.sidecar == sidecar &&
    other.smartSearch == smartSearch &&
    other.thumbnailGeneration == thumbnailGeneration &&
    other.videoConversion == videoConversion;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backgroundTask.hashCode) +
    (faceDetection.hashCode) +
    (library_.hashCode) +
    (metadataExtraction.hashCode) +
    (migration.hashCode) +
    (notifications.hashCode) +
    (search.hashCode) +
    (sidecar.hashCode) +
    (smartSearch.hashCode) +
    (thumbnailGeneration.hashCode) +
    (videoConversion.hashCode);

  @override
  String toString() => 'SystemConfigJobDto[backgroundTask=$backgroundTask, faceDetection=$faceDetection, library_=$library_, metadataExtraction=$metadataExtraction, migration=$migration, notifications=$notifications, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, thumbnailGeneration=$thumbnailGeneration, videoConversion=$videoConversion]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backgroundTask'] = this.backgroundTask;
      json[r'faceDetection'] = this.faceDetection;
      json[r'library'] = this.library_;
      json[r'metadataExtraction'] = this.metadataExtraction;
      json[r'migration'] = this.migration;
      json[r'notifications'] = this.notifications;
      json[r'search'] = this.search;
      json[r'sidecar'] = this.sidecar;
      json[r'smartSearch'] = this.smartSearch;
      json[r'thumbnailGeneration'] = this.thumbnailGeneration;
      json[r'videoConversion'] = this.videoConversion;
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
        backgroundTask: JobSettingsDto.fromJson(json[r'backgroundTask'])!,
        faceDetection: JobSettingsDto.fromJson(json[r'faceDetection'])!,
        library_: JobSettingsDto.fromJson(json[r'library'])!,
        metadataExtraction: JobSettingsDto.fromJson(json[r'metadataExtraction'])!,
        migration: JobSettingsDto.fromJson(json[r'migration'])!,
        notifications: JobSettingsDto.fromJson(json[r'notifications'])!,
        search: JobSettingsDto.fromJson(json[r'search'])!,
        sidecar: JobSettingsDto.fromJson(json[r'sidecar'])!,
        smartSearch: JobSettingsDto.fromJson(json[r'smartSearch'])!,
        thumbnailGeneration: JobSettingsDto.fromJson(json[r'thumbnailGeneration'])!,
        videoConversion: JobSettingsDto.fromJson(json[r'videoConversion'])!,
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
    'faceDetection',
    'library',
    'metadataExtraction',
    'migration',
    'notifications',
    'search',
    'sidecar',
    'smartSearch',
    'thumbnailGeneration',
    'videoConversion',
  };
}


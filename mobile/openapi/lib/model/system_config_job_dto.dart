//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigJobDto {
  /// Returns a new [SystemConfigJobDto] instance.
  SystemConfigJobDto({
    required this.thumbnailGeneration,
    required this.metadataExtraction,
    required this.videoConversion,
    required this.objectTagging,
    required this.clipEncoding,
    required this.storageTemplateMigration,
    required this.backgroundTask,
    required this.search,
    required this.recognizeFaces,
    required this.sidecar,
  });

  JobSettingsDto thumbnailGeneration;

  JobSettingsDto metadataExtraction;

  JobSettingsDto videoConversion;

  JobSettingsDto objectTagging;

  JobSettingsDto clipEncoding;

  JobSettingsDto storageTemplateMigration;

  JobSettingsDto backgroundTask;

  JobSettingsDto search;

  JobSettingsDto recognizeFaces;

  JobSettingsDto sidecar;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigJobDto &&
     other.thumbnailGeneration == thumbnailGeneration &&
     other.metadataExtraction == metadataExtraction &&
     other.videoConversion == videoConversion &&
     other.objectTagging == objectTagging &&
     other.clipEncoding == clipEncoding &&
     other.storageTemplateMigration == storageTemplateMigration &&
     other.backgroundTask == backgroundTask &&
     other.search == search &&
     other.recognizeFaces == recognizeFaces &&
     other.sidecar == sidecar;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (thumbnailGeneration.hashCode) +
    (metadataExtraction.hashCode) +
    (videoConversion.hashCode) +
    (objectTagging.hashCode) +
    (clipEncoding.hashCode) +
    (storageTemplateMigration.hashCode) +
    (backgroundTask.hashCode) +
    (search.hashCode) +
    (recognizeFaces.hashCode) +
    (sidecar.hashCode);

  @override
  String toString() => 'SystemConfigJobDto[thumbnailGeneration=$thumbnailGeneration, metadataExtraction=$metadataExtraction, videoConversion=$videoConversion, objectTagging=$objectTagging, clipEncoding=$clipEncoding, storageTemplateMigration=$storageTemplateMigration, backgroundTask=$backgroundTask, search=$search, recognizeFaces=$recognizeFaces, sidecar=$sidecar]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'thumbnailGeneration'] = this.thumbnailGeneration;
      json[r'metadataExtraction'] = this.metadataExtraction;
      json[r'videoConversion'] = this.videoConversion;
      json[r'objectTagging'] = this.objectTagging;
      json[r'clipEncoding'] = this.clipEncoding;
      json[r'storageTemplateMigration'] = this.storageTemplateMigration;
      json[r'backgroundTask'] = this.backgroundTask;
      json[r'search'] = this.search;
      json[r'recognizeFaces'] = this.recognizeFaces;
      json[r'sidecar'] = this.sidecar;
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
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SystemConfigJobDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SystemConfigJobDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SystemConfigJobDto(
        thumbnailGeneration: JobSettingsDto.fromJson(json[r'thumbnailGeneration'])!,
        metadataExtraction: JobSettingsDto.fromJson(json[r'metadataExtraction'])!,
        videoConversion: JobSettingsDto.fromJson(json[r'videoConversion'])!,
        objectTagging: JobSettingsDto.fromJson(json[r'objectTagging'])!,
        clipEncoding: JobSettingsDto.fromJson(json[r'clipEncoding'])!,
        storageTemplateMigration: JobSettingsDto.fromJson(json[r'storageTemplateMigration'])!,
        backgroundTask: JobSettingsDto.fromJson(json[r'backgroundTask'])!,
        search: JobSettingsDto.fromJson(json[r'search'])!,
        recognizeFaces: JobSettingsDto.fromJson(json[r'recognizeFaces'])!,
        sidecar: JobSettingsDto.fromJson(json[r'sidecar'])!,
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
    'thumbnailGeneration',
    'metadataExtraction',
    'videoConversion',
    'objectTagging',
    'clipEncoding',
    'storageTemplateMigration',
    'backgroundTask',
    'search',
    'recognizeFaces',
    'sidecar',
  };
}


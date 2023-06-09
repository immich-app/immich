//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AllJobStatusResponseDto {
  /// Returns a new [AllJobStatusResponseDto] instance.
  AllJobStatusResponseDto({
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

  JobStatusDto thumbnailGeneration;

  JobStatusDto metadataExtraction;

  JobStatusDto videoConversion;

  JobStatusDto objectTagging;

  JobStatusDto clipEncoding;

  JobStatusDto storageTemplateMigration;

  JobStatusDto backgroundTask;

  JobStatusDto search;

  JobStatusDto recognizeFaces;

  JobStatusDto sidecar;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AllJobStatusResponseDto &&
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
  String toString() => 'AllJobStatusResponseDto[thumbnailGeneration=$thumbnailGeneration, metadataExtraction=$metadataExtraction, videoConversion=$videoConversion, objectTagging=$objectTagging, clipEncoding=$clipEncoding, storageTemplateMigration=$storageTemplateMigration, backgroundTask=$backgroundTask, search=$search, recognizeFaces=$recognizeFaces, sidecar=$sidecar]';

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

  /// Returns a new [AllJobStatusResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AllJobStatusResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AllJobStatusResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "AllJobStatusResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AllJobStatusResponseDto(
        thumbnailGeneration: JobStatusDto.fromJson(json[r'thumbnailGeneration'])!,
        metadataExtraction: JobStatusDto.fromJson(json[r'metadataExtraction'])!,
        videoConversion: JobStatusDto.fromJson(json[r'videoConversion'])!,
        objectTagging: JobStatusDto.fromJson(json[r'objectTagging'])!,
        clipEncoding: JobStatusDto.fromJson(json[r'clipEncoding'])!,
        storageTemplateMigration: JobStatusDto.fromJson(json[r'storageTemplateMigration'])!,
        backgroundTask: JobStatusDto.fromJson(json[r'backgroundTask'])!,
        search: JobStatusDto.fromJson(json[r'search'])!,
        recognizeFaces: JobStatusDto.fromJson(json[r'recognizeFaces'])!,
        sidecar: JobStatusDto.fromJson(json[r'sidecar'])!,
      );
    }
    return null;
  }

  static List<AllJobStatusResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AllJobStatusResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AllJobStatusResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AllJobStatusResponseDto> mapFromJson(dynamic json) {
    final map = <String, AllJobStatusResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AllJobStatusResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AllJobStatusResponseDto-objects as value to a dart map
  static Map<String, List<AllJobStatusResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AllJobStatusResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AllJobStatusResponseDto.listFromJson(entry.value, growable: growable,);
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


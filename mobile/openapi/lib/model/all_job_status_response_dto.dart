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
    required this.thumbnailGenerationQueue,
    required this.metadataExtractionQueue,
    required this.videoConversionQueue,
    required this.objectTaggingQueue,
    required this.clipEncodingQueue,
    required this.storageTemplateMigrationQueue,
    required this.backgroundTaskQueue,
    required this.searchQueue,
    required this.recognizeFacesQueue,
  });

  JobStatusDto thumbnailGenerationQueue;

  JobStatusDto metadataExtractionQueue;

  JobStatusDto videoConversionQueue;

  JobStatusDto objectTaggingQueue;

  JobStatusDto clipEncodingQueue;

  JobStatusDto storageTemplateMigrationQueue;

  JobStatusDto backgroundTaskQueue;

  JobStatusDto searchQueue;

  JobStatusDto recognizeFacesQueue;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AllJobStatusResponseDto &&
     other.thumbnailGenerationQueue == thumbnailGenerationQueue &&
     other.metadataExtractionQueue == metadataExtractionQueue &&
     other.videoConversionQueue == videoConversionQueue &&
     other.objectTaggingQueue == objectTaggingQueue &&
     other.clipEncodingQueue == clipEncodingQueue &&
     other.storageTemplateMigrationQueue == storageTemplateMigrationQueue &&
     other.backgroundTaskQueue == backgroundTaskQueue &&
     other.searchQueue == searchQueue &&
     other.recognizeFacesQueue == recognizeFacesQueue;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (thumbnailGenerationQueue.hashCode) +
    (metadataExtractionQueue.hashCode) +
    (videoConversionQueue.hashCode) +
    (objectTaggingQueue.hashCode) +
    (clipEncodingQueue.hashCode) +
    (storageTemplateMigrationQueue.hashCode) +
    (backgroundTaskQueue.hashCode) +
    (searchQueue.hashCode) +
    (recognizeFacesQueue.hashCode);

  @override
  String toString() => 'AllJobStatusResponseDto[thumbnailGenerationQueue=$thumbnailGenerationQueue, metadataExtractionQueue=$metadataExtractionQueue, videoConversionQueue=$videoConversionQueue, objectTaggingQueue=$objectTaggingQueue, clipEncodingQueue=$clipEncodingQueue, storageTemplateMigrationQueue=$storageTemplateMigrationQueue, backgroundTaskQueue=$backgroundTaskQueue, searchQueue=$searchQueue, recognizeFacesQueue=$recognizeFacesQueue]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'thumbnail-generation-queue'] = this.thumbnailGenerationQueue;
      json[r'metadata-extraction-queue'] = this.metadataExtractionQueue;
      json[r'video-conversion-queue'] = this.videoConversionQueue;
      json[r'object-tagging-queue'] = this.objectTaggingQueue;
      json[r'clip-encoding-queue'] = this.clipEncodingQueue;
      json[r'storage-template-migration-queue'] = this.storageTemplateMigrationQueue;
      json[r'background-task-queue'] = this.backgroundTaskQueue;
      json[r'search-queue'] = this.searchQueue;
      json[r'recognize-faces-queue'] = this.recognizeFacesQueue;
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
        thumbnailGenerationQueue: JobStatusDto.fromJson(json[r'thumbnail-generation-queue'])!,
        metadataExtractionQueue: JobStatusDto.fromJson(json[r'metadata-extraction-queue'])!,
        videoConversionQueue: JobStatusDto.fromJson(json[r'video-conversion-queue'])!,
        objectTaggingQueue: JobStatusDto.fromJson(json[r'object-tagging-queue'])!,
        clipEncodingQueue: JobStatusDto.fromJson(json[r'clip-encoding-queue'])!,
        storageTemplateMigrationQueue: JobStatusDto.fromJson(json[r'storage-template-migration-queue'])!,
        backgroundTaskQueue: JobStatusDto.fromJson(json[r'background-task-queue'])!,
        searchQueue: JobStatusDto.fromJson(json[r'search-queue'])!,
        recognizeFacesQueue: JobStatusDto.fromJson(json[r'recognize-faces-queue'])!,
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
    'thumbnail-generation-queue',
    'metadata-extraction-queue',
    'video-conversion-queue',
    'object-tagging-queue',
    'clip-encoding-queue',
    'storage-template-migration-queue',
    'background-task-queue',
    'search-queue',
    'recognize-faces-queue',
  };
}


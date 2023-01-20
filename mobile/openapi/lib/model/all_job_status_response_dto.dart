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
    required this.thumbnailGenerationQueueCount,
    required this.metadataExtractionQueueCount,
    required this.videoConversionQueueCount,
    required this.machineLearningQueueCount,
    required this.storageMigrationQueueCount,
    required this.isThumbnailGenerationActive,
    required this.isMetadataExtractionActive,
    required this.isVideoConversionActive,
    required this.isMachineLearningActive,
    required this.isStorageMigrationActive,
  });

  JobCounts thumbnailGenerationQueueCount;

  JobCounts metadataExtractionQueueCount;

  JobCounts videoConversionQueueCount;

  JobCounts machineLearningQueueCount;

  JobCounts storageMigrationQueueCount;

  bool isThumbnailGenerationActive;

  bool isMetadataExtractionActive;

  bool isVideoConversionActive;

  bool isMachineLearningActive;

  bool isStorageMigrationActive;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AllJobStatusResponseDto &&
     other.thumbnailGenerationQueueCount == thumbnailGenerationQueueCount &&
     other.metadataExtractionQueueCount == metadataExtractionQueueCount &&
     other.videoConversionQueueCount == videoConversionQueueCount &&
     other.machineLearningQueueCount == machineLearningQueueCount &&
     other.storageMigrationQueueCount == storageMigrationQueueCount &&
     other.isThumbnailGenerationActive == isThumbnailGenerationActive &&
     other.isMetadataExtractionActive == isMetadataExtractionActive &&
     other.isVideoConversionActive == isVideoConversionActive &&
     other.isMachineLearningActive == isMachineLearningActive &&
     other.isStorageMigrationActive == isStorageMigrationActive;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (thumbnailGenerationQueueCount.hashCode) +
    (metadataExtractionQueueCount.hashCode) +
    (videoConversionQueueCount.hashCode) +
    (machineLearningQueueCount.hashCode) +
    (storageMigrationQueueCount.hashCode) +
    (isThumbnailGenerationActive.hashCode) +
    (isMetadataExtractionActive.hashCode) +
    (isVideoConversionActive.hashCode) +
    (isMachineLearningActive.hashCode) +
    (isStorageMigrationActive.hashCode);

  @override
  String toString() => 'AllJobStatusResponseDto[thumbnailGenerationQueueCount=$thumbnailGenerationQueueCount, metadataExtractionQueueCount=$metadataExtractionQueueCount, videoConversionQueueCount=$videoConversionQueueCount, machineLearningQueueCount=$machineLearningQueueCount, storageMigrationQueueCount=$storageMigrationQueueCount, isThumbnailGenerationActive=$isThumbnailGenerationActive, isMetadataExtractionActive=$isMetadataExtractionActive, isVideoConversionActive=$isVideoConversionActive, isMachineLearningActive=$isMachineLearningActive, isStorageMigrationActive=$isStorageMigrationActive]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'thumbnailGenerationQueueCount'] = this.thumbnailGenerationQueueCount;
      json[r'metadataExtractionQueueCount'] = this.metadataExtractionQueueCount;
      json[r'videoConversionQueueCount'] = this.videoConversionQueueCount;
      json[r'machineLearningQueueCount'] = this.machineLearningQueueCount;
      json[r'storageMigrationQueueCount'] = this.storageMigrationQueueCount;
      json[r'isThumbnailGenerationActive'] = this.isThumbnailGenerationActive;
      json[r'isMetadataExtractionActive'] = this.isMetadataExtractionActive;
      json[r'isVideoConversionActive'] = this.isVideoConversionActive;
      json[r'isMachineLearningActive'] = this.isMachineLearningActive;
      json[r'isStorageMigrationActive'] = this.isStorageMigrationActive;
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
        thumbnailGenerationQueueCount: JobCounts.fromJson(json[r'thumbnailGenerationQueueCount'])!,
        metadataExtractionQueueCount: JobCounts.fromJson(json[r'metadataExtractionQueueCount'])!,
        videoConversionQueueCount: JobCounts.fromJson(json[r'videoConversionQueueCount'])!,
        machineLearningQueueCount: JobCounts.fromJson(json[r'machineLearningQueueCount'])!,
        storageMigrationQueueCount: JobCounts.fromJson(json[r'storageMigrationQueueCount'])!,
        isThumbnailGenerationActive: mapValueOfType<bool>(json, r'isThumbnailGenerationActive')!,
        isMetadataExtractionActive: mapValueOfType<bool>(json, r'isMetadataExtractionActive')!,
        isVideoConversionActive: mapValueOfType<bool>(json, r'isVideoConversionActive')!,
        isMachineLearningActive: mapValueOfType<bool>(json, r'isMachineLearningActive')!,
        isStorageMigrationActive: mapValueOfType<bool>(json, r'isStorageMigrationActive')!,
      );
    }
    return null;
  }

  static List<AllJobStatusResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
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
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AllJobStatusResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'thumbnailGenerationQueueCount',
    'metadataExtractionQueueCount',
    'videoConversionQueueCount',
    'machineLearningQueueCount',
    'storageMigrationQueueCount',
    'isThumbnailGenerationActive',
    'isMetadataExtractionActive',
    'isVideoConversionActive',
    'isMachineLearningActive',
    'isStorageMigrationActive',
  };
}


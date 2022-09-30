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
    required this.isThumbnailGenerationActive,
    required this.thumbnailGenerationQueueCount,
    required this.isMetadataExtractionActive,
    required this.metadataExtractionQueueCount,
    required this.isVideoConversionActive,
    required this.videoConversionQueueCount,
  });

  bool isThumbnailGenerationActive;

  Object thumbnailGenerationQueueCount;

  bool isMetadataExtractionActive;

  Object metadataExtractionQueueCount;

  bool isVideoConversionActive;

  Object videoConversionQueueCount;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AllJobStatusResponseDto &&
     other.isThumbnailGenerationActive == isThumbnailGenerationActive &&
     other.thumbnailGenerationQueueCount == thumbnailGenerationQueueCount &&
     other.isMetadataExtractionActive == isMetadataExtractionActive &&
     other.metadataExtractionQueueCount == metadataExtractionQueueCount &&
     other.isVideoConversionActive == isVideoConversionActive &&
     other.videoConversionQueueCount == videoConversionQueueCount;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (isThumbnailGenerationActive.hashCode) +
    (thumbnailGenerationQueueCount.hashCode) +
    (isMetadataExtractionActive.hashCode) +
    (metadataExtractionQueueCount.hashCode) +
    (isVideoConversionActive.hashCode) +
    (videoConversionQueueCount.hashCode);

  @override
  String toString() => 'AllJobStatusResponseDto[isThumbnailGenerationActive=$isThumbnailGenerationActive, thumbnailGenerationQueueCount=$thumbnailGenerationQueueCount, isMetadataExtractionActive=$isMetadataExtractionActive, metadataExtractionQueueCount=$metadataExtractionQueueCount, isVideoConversionActive=$isVideoConversionActive, videoConversionQueueCount=$videoConversionQueueCount]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'isThumbnailGenerationActive'] = isThumbnailGenerationActive;
      _json[r'thumbnailGenerationQueueCount'] = thumbnailGenerationQueueCount;
      _json[r'isMetadataExtractionActive'] = isMetadataExtractionActive;
      _json[r'metadataExtractionQueueCount'] = metadataExtractionQueueCount;
      _json[r'isVideoConversionActive'] = isVideoConversionActive;
      _json[r'videoConversionQueueCount'] = videoConversionQueueCount;
    return _json;
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
        isThumbnailGenerationActive: mapValueOfType<bool>(json, r'isThumbnailGenerationActive')!,
        thumbnailGenerationQueueCount: mapValueOfType<Object>(json, r'thumbnailGenerationQueueCount')!,
        isMetadataExtractionActive: mapValueOfType<bool>(json, r'isMetadataExtractionActive')!,
        metadataExtractionQueueCount: mapValueOfType<Object>(json, r'metadataExtractionQueueCount')!,
        isVideoConversionActive: mapValueOfType<bool>(json, r'isVideoConversionActive')!,
        videoConversionQueueCount: mapValueOfType<Object>(json, r'videoConversionQueueCount')!,
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
    'isThumbnailGenerationActive',
    'thumbnailGenerationQueueCount',
    'isMetadataExtractionActive',
    'metadataExtractionQueueCount',
    'isVideoConversionActive',
    'videoConversionQueueCount',
  };
}


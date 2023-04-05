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
    required this.assetUploaded,
    required this.queueVideoConversion,
    required this.videoConversion,
    required this.queueGenerateThumbnails,
    required this.generateJpegThumbnail,
    required this.generateWebpThumbnail,
    required this.queueMetadataExtraction,
    required this.exifExtraction,
    required this.extractVideoMetadata,
    required this.queueUserDelete,
    required this.userDelete,
    required this.storageTemplateMigration,
    required this.storageTemplateMigrationSingle,
    required this.systemConfigChange,
    required this.queueObjectTagging,
    required this.detectObjects,
    required this.classifyImage,
    required this.deleteFiles,
    required this.searchIndexAssets,
    required this.searchIndexAsset,
    required this.searchIndexAlbums,
    required this.searchIndexAlbum,
    required this.searchRemoveAlbum,
    required this.searchRemoveAsset,
    required this.queueClipEncode,
    required this.clipEncode,
  });

  JobStatusDto assetUploaded;

  JobStatusDto queueVideoConversion;

  JobStatusDto videoConversion;

  JobStatusDto queueGenerateThumbnails;

  JobStatusDto generateJpegThumbnail;

  JobStatusDto generateWebpThumbnail;

  JobStatusDto queueMetadataExtraction;

  JobStatusDto exifExtraction;

  JobStatusDto extractVideoMetadata;

  JobStatusDto queueUserDelete;

  JobStatusDto userDelete;

  JobStatusDto storageTemplateMigration;

  JobStatusDto storageTemplateMigrationSingle;

  JobStatusDto systemConfigChange;

  JobStatusDto queueObjectTagging;

  JobStatusDto detectObjects;

  JobStatusDto classifyImage;

  JobStatusDto deleteFiles;

  JobStatusDto searchIndexAssets;

  JobStatusDto searchIndexAsset;

  JobStatusDto searchIndexAlbums;

  JobStatusDto searchIndexAlbum;

  JobStatusDto searchRemoveAlbum;

  JobStatusDto searchRemoveAsset;

  JobStatusDto queueClipEncode;

  JobStatusDto clipEncode;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AllJobStatusResponseDto &&
     other.assetUploaded == assetUploaded &&
     other.queueVideoConversion == queueVideoConversion &&
     other.videoConversion == videoConversion &&
     other.queueGenerateThumbnails == queueGenerateThumbnails &&
     other.generateJpegThumbnail == generateJpegThumbnail &&
     other.generateWebpThumbnail == generateWebpThumbnail &&
     other.queueMetadataExtraction == queueMetadataExtraction &&
     other.exifExtraction == exifExtraction &&
     other.extractVideoMetadata == extractVideoMetadata &&
     other.queueUserDelete == queueUserDelete &&
     other.userDelete == userDelete &&
     other.storageTemplateMigration == storageTemplateMigration &&
     other.storageTemplateMigrationSingle == storageTemplateMigrationSingle &&
     other.systemConfigChange == systemConfigChange &&
     other.queueObjectTagging == queueObjectTagging &&
     other.detectObjects == detectObjects &&
     other.classifyImage == classifyImage &&
     other.deleteFiles == deleteFiles &&
     other.searchIndexAssets == searchIndexAssets &&
     other.searchIndexAsset == searchIndexAsset &&
     other.searchIndexAlbums == searchIndexAlbums &&
     other.searchIndexAlbum == searchIndexAlbum &&
     other.searchRemoveAlbum == searchRemoveAlbum &&
     other.searchRemoveAsset == searchRemoveAsset &&
     other.queueClipEncode == queueClipEncode &&
     other.clipEncode == clipEncode;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetUploaded.hashCode) +
    (queueVideoConversion.hashCode) +
    (videoConversion.hashCode) +
    (queueGenerateThumbnails.hashCode) +
    (generateJpegThumbnail.hashCode) +
    (generateWebpThumbnail.hashCode) +
    (queueMetadataExtraction.hashCode) +
    (exifExtraction.hashCode) +
    (extractVideoMetadata.hashCode) +
    (queueUserDelete.hashCode) +
    (userDelete.hashCode) +
    (storageTemplateMigration.hashCode) +
    (storageTemplateMigrationSingle.hashCode) +
    (systemConfigChange.hashCode) +
    (queueObjectTagging.hashCode) +
    (detectObjects.hashCode) +
    (classifyImage.hashCode) +
    (deleteFiles.hashCode) +
    (searchIndexAssets.hashCode) +
    (searchIndexAsset.hashCode) +
    (searchIndexAlbums.hashCode) +
    (searchIndexAlbum.hashCode) +
    (searchRemoveAlbum.hashCode) +
    (searchRemoveAsset.hashCode) +
    (queueClipEncode.hashCode) +
    (clipEncode.hashCode);

  @override
  String toString() => 'AllJobStatusResponseDto[assetUploaded=$assetUploaded, queueVideoConversion=$queueVideoConversion, videoConversion=$videoConversion, queueGenerateThumbnails=$queueGenerateThumbnails, generateJpegThumbnail=$generateJpegThumbnail, generateWebpThumbnail=$generateWebpThumbnail, queueMetadataExtraction=$queueMetadataExtraction, exifExtraction=$exifExtraction, extractVideoMetadata=$extractVideoMetadata, queueUserDelete=$queueUserDelete, userDelete=$userDelete, storageTemplateMigration=$storageTemplateMigration, storageTemplateMigrationSingle=$storageTemplateMigrationSingle, systemConfigChange=$systemConfigChange, queueObjectTagging=$queueObjectTagging, detectObjects=$detectObjects, classifyImage=$classifyImage, deleteFiles=$deleteFiles, searchIndexAssets=$searchIndexAssets, searchIndexAsset=$searchIndexAsset, searchIndexAlbums=$searchIndexAlbums, searchIndexAlbum=$searchIndexAlbum, searchRemoveAlbum=$searchRemoveAlbum, searchRemoveAsset=$searchRemoveAsset, queueClipEncode=$queueClipEncode, clipEncode=$clipEncode]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'asset-uploaded'] = this.assetUploaded;
      json[r'queue-video-conversion'] = this.queueVideoConversion;
      json[r'video-conversion'] = this.videoConversion;
      json[r'queue-generate-thumbnails'] = this.queueGenerateThumbnails;
      json[r'generate-jpeg-thumbnail'] = this.generateJpegThumbnail;
      json[r'generate-webp-thumbnail'] = this.generateWebpThumbnail;
      json[r'queue-metadata-extraction'] = this.queueMetadataExtraction;
      json[r'exif-extraction'] = this.exifExtraction;
      json[r'extract-video-metadata'] = this.extractVideoMetadata;
      json[r'queue-user-delete'] = this.queueUserDelete;
      json[r'user-delete'] = this.userDelete;
      json[r'storage-template-migration'] = this.storageTemplateMigration;
      json[r'storage-template-migration-single'] = this.storageTemplateMigrationSingle;
      json[r'system-config-change'] = this.systemConfigChange;
      json[r'queue-object-tagging'] = this.queueObjectTagging;
      json[r'detect-objects'] = this.detectObjects;
      json[r'classify-image'] = this.classifyImage;
      json[r'delete-files'] = this.deleteFiles;
      json[r'search-index-assets'] = this.searchIndexAssets;
      json[r'search-index-asset'] = this.searchIndexAsset;
      json[r'search-index-albums'] = this.searchIndexAlbums;
      json[r'search-index-album'] = this.searchIndexAlbum;
      json[r'search-remove-album'] = this.searchRemoveAlbum;
      json[r'search-remove-asset'] = this.searchRemoveAsset;
      json[r'queue-clip-encode'] = this.queueClipEncode;
      json[r'clip-encode'] = this.clipEncode;
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
        assetUploaded: JobStatusDto.fromJson(json[r'asset-uploaded'])!,
        queueVideoConversion: JobStatusDto.fromJson(json[r'queue-video-conversion'])!,
        videoConversion: JobStatusDto.fromJson(json[r'video-conversion'])!,
        queueGenerateThumbnails: JobStatusDto.fromJson(json[r'queue-generate-thumbnails'])!,
        generateJpegThumbnail: JobStatusDto.fromJson(json[r'generate-jpeg-thumbnail'])!,
        generateWebpThumbnail: JobStatusDto.fromJson(json[r'generate-webp-thumbnail'])!,
        queueMetadataExtraction: JobStatusDto.fromJson(json[r'queue-metadata-extraction'])!,
        exifExtraction: JobStatusDto.fromJson(json[r'exif-extraction'])!,
        extractVideoMetadata: JobStatusDto.fromJson(json[r'extract-video-metadata'])!,
        queueUserDelete: JobStatusDto.fromJson(json[r'queue-user-delete'])!,
        userDelete: JobStatusDto.fromJson(json[r'user-delete'])!,
        storageTemplateMigration: JobStatusDto.fromJson(json[r'storage-template-migration'])!,
        storageTemplateMigrationSingle: JobStatusDto.fromJson(json[r'storage-template-migration-single'])!,
        systemConfigChange: JobStatusDto.fromJson(json[r'system-config-change'])!,
        queueObjectTagging: JobStatusDto.fromJson(json[r'queue-object-tagging'])!,
        detectObjects: JobStatusDto.fromJson(json[r'detect-objects'])!,
        classifyImage: JobStatusDto.fromJson(json[r'classify-image'])!,
        deleteFiles: JobStatusDto.fromJson(json[r'delete-files'])!,
        searchIndexAssets: JobStatusDto.fromJson(json[r'search-index-assets'])!,
        searchIndexAsset: JobStatusDto.fromJson(json[r'search-index-asset'])!,
        searchIndexAlbums: JobStatusDto.fromJson(json[r'search-index-albums'])!,
        searchIndexAlbum: JobStatusDto.fromJson(json[r'search-index-album'])!,
        searchRemoveAlbum: JobStatusDto.fromJson(json[r'search-remove-album'])!,
        searchRemoveAsset: JobStatusDto.fromJson(json[r'search-remove-asset'])!,
        queueClipEncode: JobStatusDto.fromJson(json[r'queue-clip-encode'])!,
        clipEncode: JobStatusDto.fromJson(json[r'clip-encode'])!,
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
    'asset-uploaded',
    'queue-video-conversion',
    'video-conversion',
    'queue-generate-thumbnails',
    'generate-jpeg-thumbnail',
    'generate-webp-thumbnail',
    'queue-metadata-extraction',
    'exif-extraction',
    'extract-video-metadata',
    'queue-user-delete',
    'user-delete',
    'storage-template-migration',
    'storage-template-migration-single',
    'system-config-change',
    'queue-object-tagging',
    'detect-objects',
    'classify-image',
    'delete-files',
    'search-index-assets',
    'search-index-asset',
    'search-index-albums',
    'search-index-album',
    'search-remove-album',
    'search-remove-asset',
    'queue-clip-encode',
    'clip-encode',
  };
}


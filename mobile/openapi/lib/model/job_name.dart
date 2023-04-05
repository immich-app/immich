//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class JobName {
  /// Instantiate a new enum with the provided [value].
  const JobName._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const assetUploaded = JobName._(r'asset-uploaded');
  static const queueVideoConversion = JobName._(r'queue-video-conversion');
  static const videoConversion = JobName._(r'video-conversion');
  static const queueGenerateThumbnails = JobName._(r'queue-generate-thumbnails');
  static const generateJpegThumbnail = JobName._(r'generate-jpeg-thumbnail');
  static const generateWebpThumbnail = JobName._(r'generate-webp-thumbnail');
  static const queueMetadataExtraction = JobName._(r'queue-metadata-extraction');
  static const exifExtraction = JobName._(r'exif-extraction');
  static const extractVideoMetadata = JobName._(r'extract-video-metadata');
  static const queueUserDelete = JobName._(r'queue-user-delete');
  static const userDelete = JobName._(r'user-delete');
  static const storageTemplateMigration = JobName._(r'storage-template-migration');
  static const storageTemplateMigrationSingle = JobName._(r'storage-template-migration-single');
  static const systemConfigChange = JobName._(r'system-config-change');
  static const queueObjectTagging = JobName._(r'queue-object-tagging');
  static const detectObjects = JobName._(r'detect-objects');
  static const classifyImage = JobName._(r'classify-image');
  static const deleteFiles = JobName._(r'delete-files');
  static const searchIndexAssets = JobName._(r'search-index-assets');
  static const searchIndexAsset = JobName._(r'search-index-asset');
  static const searchIndexAlbums = JobName._(r'search-index-albums');
  static const searchIndexAlbum = JobName._(r'search-index-album');
  static const searchRemoveAlbum = JobName._(r'search-remove-album');
  static const searchRemoveAsset = JobName._(r'search-remove-asset');
  static const queueClipEncode = JobName._(r'queue-clip-encode');
  static const clipEncode = JobName._(r'clip-encode');

  /// List of all possible values in this [enum][JobName].
  static const values = <JobName>[
    assetUploaded,
    queueVideoConversion,
    videoConversion,
    queueGenerateThumbnails,
    generateJpegThumbnail,
    generateWebpThumbnail,
    queueMetadataExtraction,
    exifExtraction,
    extractVideoMetadata,
    queueUserDelete,
    userDelete,
    storageTemplateMigration,
    storageTemplateMigrationSingle,
    systemConfigChange,
    queueObjectTagging,
    detectObjects,
    classifyImage,
    deleteFiles,
    searchIndexAssets,
    searchIndexAsset,
    searchIndexAlbums,
    searchIndexAlbum,
    searchRemoveAlbum,
    searchRemoveAsset,
    queueClipEncode,
    clipEncode,
  ];

  static JobName? fromJson(dynamic value) => JobNameTypeTransformer().decode(value);

  static List<JobName>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobName>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobName.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [JobName] to String,
/// and [decode] dynamic data back to [JobName].
class JobNameTypeTransformer {
  factory JobNameTypeTransformer() => _instance ??= const JobNameTypeTransformer._();

  const JobNameTypeTransformer._();

  String encode(JobName data) => data.value;

  /// Decodes a [dynamic value][data] to a JobName.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  JobName? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data.toString()) {
        case r'asset-uploaded': return JobName.assetUploaded;
        case r'queue-video-conversion': return JobName.queueVideoConversion;
        case r'video-conversion': return JobName.videoConversion;
        case r'queue-generate-thumbnails': return JobName.queueGenerateThumbnails;
        case r'generate-jpeg-thumbnail': return JobName.generateJpegThumbnail;
        case r'generate-webp-thumbnail': return JobName.generateWebpThumbnail;
        case r'queue-metadata-extraction': return JobName.queueMetadataExtraction;
        case r'exif-extraction': return JobName.exifExtraction;
        case r'extract-video-metadata': return JobName.extractVideoMetadata;
        case r'queue-user-delete': return JobName.queueUserDelete;
        case r'user-delete': return JobName.userDelete;
        case r'storage-template-migration': return JobName.storageTemplateMigration;
        case r'storage-template-migration-single': return JobName.storageTemplateMigrationSingle;
        case r'system-config-change': return JobName.systemConfigChange;
        case r'queue-object-tagging': return JobName.queueObjectTagging;
        case r'detect-objects': return JobName.detectObjects;
        case r'classify-image': return JobName.classifyImage;
        case r'delete-files': return JobName.deleteFiles;
        case r'search-index-assets': return JobName.searchIndexAssets;
        case r'search-index-asset': return JobName.searchIndexAsset;
        case r'search-index-albums': return JobName.searchIndexAlbums;
        case r'search-index-album': return JobName.searchIndexAlbum;
        case r'search-remove-album': return JobName.searchRemoveAlbum;
        case r'search-remove-asset': return JobName.searchRemoveAsset;
        case r'queue-clip-encode': return JobName.queueClipEncode;
        case r'clip-encode': return JobName.clipEncode;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [JobNameTypeTransformer] instance.
  static JobNameTypeTransformer? _instance;
}


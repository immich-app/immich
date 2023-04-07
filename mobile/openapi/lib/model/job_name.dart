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

  static const thumbnailGenerationQueue = JobName._(r'thumbnail-generation-queue');
  static const metadataExtractionQueue = JobName._(r'metadata-extraction-queue');
  static const videoConversionQueue = JobName._(r'video-conversion-queue');
  static const objectTaggingQueue = JobName._(r'object-tagging-queue');
  static const clipEncodingQueue = JobName._(r'clip-encoding-queue');
  static const backgroundTaskQueue = JobName._(r'background-task-queue');
  static const storageTemplateMigrationQueue = JobName._(r'storage-template-migration-queue');
  static const searchQueue = JobName._(r'search-queue');

  /// List of all possible values in this [enum][JobName].
  static const values = <JobName>[
    thumbnailGenerationQueue,
    metadataExtractionQueue,
    videoConversionQueue,
    objectTaggingQueue,
    clipEncodingQueue,
    backgroundTaskQueue,
    storageTemplateMigrationQueue,
    searchQueue,
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
      switch (data) {
        case r'thumbnail-generation-queue': return JobName.thumbnailGenerationQueue;
        case r'metadata-extraction-queue': return JobName.metadataExtractionQueue;
        case r'video-conversion-queue': return JobName.videoConversionQueue;
        case r'object-tagging-queue': return JobName.objectTaggingQueue;
        case r'clip-encoding-queue': return JobName.clipEncodingQueue;
        case r'background-task-queue': return JobName.backgroundTaskQueue;
        case r'storage-template-migration-queue': return JobName.storageTemplateMigrationQueue;
        case r'search-queue': return JobName.searchQueue;
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


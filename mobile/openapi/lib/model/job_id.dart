//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class JobId {
  /// Instantiate a new enum with the provided [value].
  const JobId._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const thumbnailGeneration = JobId._(r'thumbnail-generation');
  static const metadataExtraction = JobId._(r'metadata-extraction');
  static const videoConversion = JobId._(r'video-conversion');
  static const machineLearning = JobId._(r'machine-learning');
  static const storageTemplateMigration = JobId._(r'storage-template-migration');

  /// List of all possible values in this [enum][JobId].
  static const values = <JobId>[
    thumbnailGeneration,
    metadataExtraction,
    videoConversion,
    machineLearning,
    storageTemplateMigration,
  ];

  static JobId? fromJson(dynamic value) => JobIdTypeTransformer().decode(value);

  static List<JobId>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobId>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobId.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [JobId] to String,
/// and [decode] dynamic data back to [JobId].
class JobIdTypeTransformer {
  factory JobIdTypeTransformer() => _instance ??= const JobIdTypeTransformer._();

  const JobIdTypeTransformer._();

  String encode(JobId data) => data.value;

  /// Decodes a [dynamic value][data] to a JobId.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  JobId? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data.toString()) {
        case r'thumbnail-generation': return JobId.thumbnailGeneration;
        case r'metadata-extraction': return JobId.metadataExtraction;
        case r'video-conversion': return JobId.videoConversion;
        case r'machine-learning': return JobId.machineLearning;
        case r'storage-template-migration': return JobId.storageTemplateMigration;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [JobIdTypeTransformer] instance.
  static JobIdTypeTransformer? _instance;
}


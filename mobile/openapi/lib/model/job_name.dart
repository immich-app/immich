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

  static const thumbnailGeneration = JobName._(r'thumbnailGeneration');
  static const metadataExtraction = JobName._(r'metadataExtraction');
  static const videoConversion = JobName._(r'videoConversion');
  static const objectTagging = JobName._(r'objectTagging');
  static const recognizeFaces = JobName._(r'recognizeFaces');
  static const clipEncoding = JobName._(r'clipEncoding');
  static const backgroundTask = JobName._(r'backgroundTask');
  static const storageTemplateMigration = JobName._(r'storageTemplateMigration');
  static const search = JobName._(r'search');
  static const sidecar = JobName._(r'sidecar');

  /// List of all possible values in this [enum][JobName].
  static const values = <JobName>[
    thumbnailGeneration,
    metadataExtraction,
    videoConversion,
    objectTagging,
    recognizeFaces,
    clipEncoding,
    backgroundTask,
    storageTemplateMigration,
    search,
    sidecar,
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
        case r'thumbnailGeneration': return JobName.thumbnailGeneration;
        case r'metadataExtraction': return JobName.metadataExtraction;
        case r'videoConversion': return JobName.videoConversion;
        case r'objectTagging': return JobName.objectTagging;
        case r'recognizeFaces': return JobName.recognizeFaces;
        case r'clipEncoding': return JobName.clipEncoding;
        case r'backgroundTask': return JobName.backgroundTask;
        case r'storageTemplateMigration': return JobName.storageTemplateMigration;
        case r'search': return JobName.search;
        case r'sidecar': return JobName.sidecar;
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


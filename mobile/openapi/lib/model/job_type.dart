//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class JobType {
  /// Instantiate a new enum with the provided [value].
  const JobType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const THUMBNAIL_GENERATION = JobType._(r'THUMBNAIL_GENERATION');
  static const METADATA_EXTRACTION = JobType._(r'METADATA_EXTRACTION');
  static const VIDEO_CONVERSION = JobType._(r'VIDEO_CONVERSION');
  static const CHECKSUM_GENERATION = JobType._(r'CHECKSUM_GENERATION');

  /// List of all possible values in this [enum][JobType].
  static const values = <JobType>[
    THUMBNAIL_GENERATION,
    METADATA_EXTRACTION,
    VIDEO_CONVERSION,
    CHECKSUM_GENERATION,
  ];

  static JobType? fromJson(dynamic value) => JobTypeTypeTransformer().decode(value);

  static List<JobType>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [JobType] to String,
/// and [decode] dynamic data back to [JobType].
class JobTypeTypeTransformer {
  factory JobTypeTypeTransformer() => _instance ??= const JobTypeTypeTransformer._();

  const JobTypeTypeTransformer._();

  String encode(JobType data) => data.value;

  /// Decodes a [dynamic value][data] to a JobType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  JobType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data.toString()) {
        case r'THUMBNAIL_GENERATION': return JobType.THUMBNAIL_GENERATION;
        case r'METADATA_EXTRACTION': return JobType.METADATA_EXTRACTION;
        case r'VIDEO_CONVERSION': return JobType.VIDEO_CONVERSION;
        case r'CHECKSUM_GENERATION': return JobType.CHECKSUM_GENERATION;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [JobTypeTypeTransformer] instance.
  static JobTypeTypeTransformer? _instance;
}


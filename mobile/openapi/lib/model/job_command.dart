//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class JobCommand {
  /// Instantiate a new enum with the provided [value].
  const JobCommand._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const start = JobCommand._(r'start');
  static const pause = JobCommand._(r'pause');
  static const resume = JobCommand._(r'resume');
  static const empty = JobCommand._(r'empty');
  static const clearFailed = JobCommand._(r'clear-failed');

  /// List of all possible values in this [enum][JobCommand].
  static const values = <JobCommand>[
    start,
    pause,
    resume,
    empty,
    clearFailed,
  ];

  static JobCommand? fromJson(dynamic value) => JobCommandTypeTransformer().decode(value);

  static List<JobCommand> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobCommand>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobCommand.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [JobCommand] to String,
/// and [decode] dynamic data back to [JobCommand].
class JobCommandTypeTransformer {
  factory JobCommandTypeTransformer() => _instance ??= const JobCommandTypeTransformer._();

  const JobCommandTypeTransformer._();

  String encode(JobCommand data) => data.value;

  /// Decodes a [dynamic value][data] to a JobCommand.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  JobCommand? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'start': return JobCommand.start;
        case r'pause': return JobCommand.pause;
        case r'resume': return JobCommand.resume;
        case r'empty': return JobCommand.empty;
        case r'clear-failed': return JobCommand.clearFailed;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [JobCommandTypeTransformer] instance.
  static JobCommandTypeTransformer? _instance;
}


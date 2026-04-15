//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class RunStatus {
  /// Instantiate a new enum with the provided [value].
  const RunStatus._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const incomplete = RunStatus._(r'incomplete');
  static const complete = RunStatus._(r'complete');
  static const failed = RunStatus._(r'failed');

  /// List of all possible values in this [enum][RunStatus].
  static const values = <RunStatus>[
    incomplete,
    complete,
    failed,
  ];

  static RunStatus? fromJson(dynamic value) => RunStatusTypeTransformer().decode(value);

  static List<RunStatus> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RunStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RunStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [RunStatus] to String,
/// and [decode] dynamic data back to [RunStatus].
class RunStatusTypeTransformer {
  factory RunStatusTypeTransformer() => _instance ??= const RunStatusTypeTransformer._();

  const RunStatusTypeTransformer._();

  String encode(RunStatus data) => data.value;

  /// Decodes a [dynamic value][data] to a RunStatus.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  RunStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'incomplete': return RunStatus.incomplete;
        case r'complete': return RunStatus.complete;
        case r'failed': return RunStatus.failed;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [RunStatusTypeTransformer] instance.
  static RunStatusTypeTransformer? _instance;
}


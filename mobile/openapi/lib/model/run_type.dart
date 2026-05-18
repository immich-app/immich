//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class RunType {
  /// Instantiate a new enum with the provided [value].
  const RunType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const schedule = RunType._(r'schedule');
  static const restore = RunType._(r'restore');
  static const backup = RunType._(r'backup');
  static const forget = RunType._(r'forget');

  /// List of all possible values in this [enum][RunType].
  static const values = <RunType>[
    schedule,
    restore,
    backup,
    forget,
  ];

  static RunType? fromJson(dynamic value) => RunTypeTypeTransformer().decode(value);

  static List<RunType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RunType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RunType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [RunType] to String,
/// and [decode] dynamic data back to [RunType].
class RunTypeTypeTransformer {
  factory RunTypeTypeTransformer() => _instance ??= const RunTypeTypeTransformer._();

  const RunTypeTypeTransformer._();

  String encode(RunType data) => data.value;

  /// Decodes a [dynamic value][data] to a RunType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  RunType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'schedule': return RunType.schedule;
        case r'restore': return RunType.restore;
        case r'backup': return RunType.backup;
        case r'forget': return RunType.forget;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [RunTypeTypeTransformer] instance.
  static RunTypeTypeTransformer? _instance;
}


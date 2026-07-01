//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class TaskStatus {
  /// Instantiate a new enum with the provided [value].
  const TaskStatus._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const incomplete = TaskStatus._(r'incomplete');
  static const complete = TaskStatus._(r'complete');
  static const failed = TaskStatus._(r'failed');

  /// List of all possible values in this [enum][TaskStatus].
  static const values = <TaskStatus>[
    incomplete,
    complete,
    failed,
  ];

  static TaskStatus? fromJson(dynamic value) => TaskStatusTypeTransformer().decode(value);

  static List<TaskStatus> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TaskStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TaskStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TaskStatus] to String,
/// and [decode] dynamic data back to [TaskStatus].
class TaskStatusTypeTransformer {
  factory TaskStatusTypeTransformer() => _instance ??= const TaskStatusTypeTransformer._();

  const TaskStatusTypeTransformer._();

  String encode(TaskStatus data) => data.value;

  /// Decodes a [dynamic value][data] to a TaskStatus.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TaskStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'incomplete': return TaskStatus.incomplete;
        case r'complete': return TaskStatus.complete;
        case r'failed': return TaskStatus.failed;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [TaskStatusTypeTransformer] instance.
  static TaskStatusTypeTransformer? _instance;
}


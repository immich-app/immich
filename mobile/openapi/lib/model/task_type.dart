//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class TaskType {
  /// Instantiate a new enum with the provided [value].
  const TaskType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const schedule = TaskType._(r'schedule');
  static const restore = TaskType._(r'restore');
  static const backup = TaskType._(r'backup');
  static const forget = TaskType._(r'forget');

  /// List of all possible values in this [enum][TaskType].
  static const values = <TaskType>[
    schedule,
    restore,
    backup,
    forget,
  ];

  static TaskType? fromJson(dynamic value) => TaskTypeTypeTransformer().decode(value);

  static List<TaskType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TaskType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TaskType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TaskType] to String,
/// and [decode] dynamic data back to [TaskType].
class TaskTypeTypeTransformer {
  factory TaskTypeTypeTransformer() => _instance ??= const TaskTypeTypeTransformer._();

  const TaskTypeTypeTransformer._();

  String encode(TaskType data) => data.value;

  /// Decodes a [dynamic value][data] to a TaskType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TaskType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'schedule': return TaskType.schedule;
        case r'restore': return TaskType.restore;
        case r'backup': return TaskType.backup;
        case r'forget': return TaskType.forget;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [TaskTypeTypeTransformer] instance.
  static TaskTypeTypeTransformer? _instance;
}


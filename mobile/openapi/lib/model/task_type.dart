//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


enum TaskType {
  schedule._(r'schedule'),
  restore._(r'restore'),
  backup._(r'backup'),
  forget._(r'forget'),
  ;

  /// Instantiate a new enum with the provided value.
  const TaskType._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [TaskType] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static TaskType? fromJson(dynamic value) => TaskTypeTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [TaskType]
  /// that were successfully decoded from the passed [JSON][json].
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

  /// Encodes this enum as a value suitable for JSON.
  String encode(TaskType data) => data._value;

  /// Returns the instance of [TaskType] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TaskType? decode(dynamic data, {bool allowNull = true}) {
    if (data is TaskType) {
      return data;
    }
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

  /// The singleton instance of this transformer.
  static TaskTypeTypeTransformer? _instance;
}


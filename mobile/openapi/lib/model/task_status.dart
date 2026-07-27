//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


enum TaskStatus {
  incomplete._(r'incomplete'),
  complete._(r'complete'),
  failed._(r'failed'),
  ;

  /// Instantiate a new enum with the provided value.
  const TaskStatus._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [TaskStatus] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static TaskStatus? fromJson(dynamic value) => TaskStatusTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [TaskStatus]
  /// that were successfully decoded from the passed [JSON][json].
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

  /// Encodes this enum as a value suitable for JSON.
  String encode(TaskStatus data) => data._value;

  /// Returns the instance of [TaskStatus] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TaskStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data is TaskStatus) {
      return data;
    }
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

  /// The singleton instance of this transformer.
  static TaskStatusTypeTransformer? _instance;
}


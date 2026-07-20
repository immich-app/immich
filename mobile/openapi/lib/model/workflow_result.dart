//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Workflow run result
class WorkflowResult {
  /// Instantiate a new enum with the provided [value].
  const WorkflowResult._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const completed = WorkflowResult._(r'completed');
  static const halted = WorkflowResult._(r'halted');
  static const error = WorkflowResult._(r'error');

  /// List of all possible values in this [enum][WorkflowResult].
  static const values = <WorkflowResult>[
    completed,
    halted,
    error,
  ];

  static WorkflowResult? fromJson(dynamic value) => WorkflowResultTypeTransformer().decode(value);

  static List<WorkflowResult> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowResult>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowResult.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [WorkflowResult] to String,
/// and [decode] dynamic data back to [WorkflowResult].
class WorkflowResultTypeTransformer {
  factory WorkflowResultTypeTransformer() => _instance ??= const WorkflowResultTypeTransformer._();

  const WorkflowResultTypeTransformer._();

  String encode(WorkflowResult data) => data.value;

  /// Decodes a [dynamic value][data] to a WorkflowResult.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  WorkflowResult? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'completed': return WorkflowResult.completed;
        case r'halted': return WorkflowResult.halted;
        case r'error': return WorkflowResult.error;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [WorkflowResultTypeTransformer] instance.
  static WorkflowResultTypeTransformer? _instance;
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Workflow type
class WorkflowType {
  /// Instantiate a new enum with the provided [value].
  const WorkflowType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const assetV1 = WorkflowType._(r'AssetV1');

  /// List of all possible values in this [enum][WorkflowType].
  static const values = <WorkflowType>[
    assetV1,
  ];

  static WorkflowType? fromJson(dynamic value) => WorkflowTypeTypeTransformer().decode(value);

  static List<WorkflowType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [WorkflowType] to String,
/// and [decode] dynamic data back to [WorkflowType].
class WorkflowTypeTypeTransformer {
  factory WorkflowTypeTypeTransformer() => _instance ??= const WorkflowTypeTypeTransformer._();

  const WorkflowTypeTypeTransformer._();

  String encode(WorkflowType data) => data.value;

  /// Decodes a [dynamic value][data] to a WorkflowType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  WorkflowType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'AssetV1': return WorkflowType.assetV1;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [WorkflowTypeTypeTransformer] instance.
  static WorkflowTypeTypeTransformer? _instance;
}


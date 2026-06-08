//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Plugin trigger type
class WorkflowTrigger {
  /// Instantiate a new enum with the provided [value].
  const WorkflowTrigger._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const assetCreate = WorkflowTrigger._(r'AssetCreate');
  static const assetMetadataExtraction = WorkflowTrigger._(r'AssetMetadataExtraction');
  static const personRecognized = WorkflowTrigger._(r'PersonRecognized');

  /// List of all possible values in this [enum][WorkflowTrigger].
  static const values = <WorkflowTrigger>[
    assetCreate,
    assetMetadataExtraction,
    personRecognized,
  ];

  static WorkflowTrigger? fromJson(dynamic value) => WorkflowTriggerTypeTransformer().decode(value);

  static List<WorkflowTrigger> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowTrigger>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowTrigger.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [WorkflowTrigger] to String,
/// and [decode] dynamic data back to [WorkflowTrigger].
class WorkflowTriggerTypeTransformer {
  factory WorkflowTriggerTypeTransformer() => _instance ??= const WorkflowTriggerTypeTransformer._();

  const WorkflowTriggerTypeTransformer._();

  String encode(WorkflowTrigger data) => data.value;

  /// Decodes a [dynamic value][data] to a WorkflowTrigger.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  WorkflowTrigger? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'AssetCreate': return WorkflowTrigger.assetCreate;
        case r'AssetMetadataExtraction': return WorkflowTrigger.assetMetadataExtraction;
        case r'PersonRecognized': return WorkflowTrigger.personRecognized;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [WorkflowTriggerTypeTransformer] instance.
  static WorkflowTriggerTypeTransformer? _instance;
}


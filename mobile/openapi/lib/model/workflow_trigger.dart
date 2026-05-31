// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Plugin trigger type
enum WorkflowTrigger {
  assetCreate._(r'AssetCreate'),
  assetMetadataExtraction._(r'AssetMetadataExtraction'),
  personRecognized._(r'PersonRecognized'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const WorkflowTrigger._(this.value);

  final String value;

  static WorkflowTrigger? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

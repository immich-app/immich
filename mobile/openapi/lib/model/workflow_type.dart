// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Workflow type
enum WorkflowType {
  assetV1._(r'AssetV1'),
  assetPersonV1._(r'AssetPersonV1'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const WorkflowType._(this.value);

  final String value;

  static WorkflowType? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

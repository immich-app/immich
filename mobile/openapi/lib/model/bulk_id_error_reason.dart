// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Error reason
enum BulkIdErrorReason {
  duplicate._(r'duplicate'),
  noPermission._(r'no_permission'),
  notFound._(r'not_found'),
  unknown._(r'unknown'),
  validation._(r'validation'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const BulkIdErrorReason._(this.value);

  final String value;

  static BulkIdErrorReason? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

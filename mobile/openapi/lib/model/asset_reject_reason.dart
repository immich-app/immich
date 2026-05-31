// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Rejection reason if rejected
enum AssetRejectReason {
  duplicate._(r'duplicate'),
  unsupportedFormat._(r'unsupported-format'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const AssetRejectReason._(this.value);

  final String value;

  static AssetRejectReason? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

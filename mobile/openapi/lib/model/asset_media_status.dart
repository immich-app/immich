// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Upload status
enum AssetMediaStatus {
  created._(r'created'),
  duplicate._(r'duplicate'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const AssetMediaStatus._(this.value);

  final String value;

  static AssetMediaStatus? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

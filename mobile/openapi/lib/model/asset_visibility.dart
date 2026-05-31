// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Asset visibility
enum AssetVisibility {
  archive._(r'archive'),
  timeline._(r'timeline'),
  hidden._(r'hidden'),
  locked._(r'locked'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const AssetVisibility._(this.value);

  final String value;

  static AssetVisibility? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

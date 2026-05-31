// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Asset sort order
enum AssetOrder {
  asc._(r'asc'),
  desc._(r'desc'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const AssetOrder._(this.value);

  final String value;

  static AssetOrder? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Asset media size
enum AssetMediaSize {
  original._(r'original'),
  fullsize._(r'fullsize'),
  preview._(r'preview'),
  thumbnail._(r'thumbnail'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const AssetMediaSize._(this.value);

  final String value;

  static AssetMediaSize? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

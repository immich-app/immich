// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Image format
enum ImageFormat {
  jpeg._(r'jpeg'),
  webp._(r'webp'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const ImageFormat._(this.value);

  final String value;

  static ImageFormat? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

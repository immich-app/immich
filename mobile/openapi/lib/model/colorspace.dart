// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Colorspace
enum Colorspace {
  srgb._(r'srgb'),
  p3._(r'p3'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const Colorspace._(this.value);

  final String value;

  static Colorspace? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

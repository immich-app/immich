// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Axis to mirror along
enum MirrorAxis {
  horizontal._(r'horizontal'),
  vertical._(r'vertical'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const MirrorAxis._(this.value);

  final String value;

  static MirrorAxis? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Target video codec
enum VideoCodec {
  h264._(r'h264'),
  hevc._(r'hevc'),
  vp9._(r'vp9'),
  av1._(r'av1'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const VideoCodec._(this.value);

  final String value;

  static VideoCodec? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

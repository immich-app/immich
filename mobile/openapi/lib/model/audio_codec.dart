// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Target audio codec
enum AudioCodec {
  mp3._(r'mp3'),
  aac._(r'aac'),
  opus._(r'opus'),
  pcmS16le._(r'pcm_s16le'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const AudioCodec._(this.value);

  final String value;

  static AudioCodec? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

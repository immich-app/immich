// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Accepted video containers
enum VideoContainer {
  mov._(r'mov'),
  mp4._(r'mp4'),
  ogg._(r'ogg'),
  webm._(r'webm'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const VideoContainer._(this.value);

  final String value;

  static VideoContainer? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

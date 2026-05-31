// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Transcode policy
enum TranscodePolicy {
  all._(r'all'),
  optimal._(r'optimal'),
  bitrate._(r'bitrate'),
  required._(r'required'),
  disabled._(r'disabled'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const TranscodePolicy._(this.value);

  final String value;

  static TranscodePolicy? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

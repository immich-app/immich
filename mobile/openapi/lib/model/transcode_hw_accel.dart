// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Transcode hardware acceleration
enum TranscodeHwAccel {
  nvenc._(r'nvenc'),
  qsv._(r'qsv'),
  vaapi._(r'vaapi'),
  rkmpp._(r'rkmpp'),
  disabled._(r'disabled'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const TranscodeHwAccel._(this.value);

  final String value;

  static TranscodeHwAccel? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

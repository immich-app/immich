// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// CQ mode
enum CqMode {
  auto._(r'auto'),
  cqp._(r'cqp'),
  icq._(r'icq'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const CqMode._(this.value);

  final String value;

  static CqMode? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Log level
enum LogLevel {
  verbose._(r'verbose'),
  debug._(r'debug'),
  log._(r'log'),
  warn._(r'warn'),
  error._(r'error'),
  fatal._(r'fatal'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const LogLevel._(this.value);

  final String value;

  static LogLevel? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

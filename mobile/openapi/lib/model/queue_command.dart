// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Queue command to execute
enum QueueCommand {
  start._(r'start'),
  pause._(r'pause'),
  resume._(r'resume'),
  empty._(r'empty'),
  clearFailed._(r'clear-failed'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const QueueCommand._(this.value);

  final String value;

  static QueueCommand? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Queue job status
enum QueueJobStatus {
  active._(r'active'),
  failed._(r'failed'),
  completed._(r'completed'),
  delayed._(r'delayed'),
  waiting._(r'waiting'),
  paused._(r'paused'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const QueueJobStatus._(this.value);

  final String value;

  static QueueJobStatus? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

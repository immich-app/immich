// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Notification level
enum NotificationLevel {
  success._(r'success'),
  error._(r'error'),
  warning._(r'warning'),
  info._(r'info'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const NotificationLevel._(this.value);

  final String value;

  static NotificationLevel? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Notification type
enum NotificationType {
  jobFailed._(r'JobFailed'),
  backupFailed._(r'BackupFailed'),
  systemMessage._(r'SystemMessage'),
  albumInvite._(r'AlbumInvite'),
  albumUpdate._(r'AlbumUpdate'),
  custom._(r'Custom'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const NotificationType._(this.value);

  final String value;

  static NotificationType? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

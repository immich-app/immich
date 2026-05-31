// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Manual job name
enum ManualJobName {
  personCleanup._(r'person-cleanup'),
  tagCleanup._(r'tag-cleanup'),
  userCleanup._(r'user-cleanup'),
  memoryCleanup._(r'memory-cleanup'),
  memoryCreate._(r'memory-create'),
  backupDatabase._(r'backup-database'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const ManualJobName._(this.value);

  final String value;

  static ManualJobName? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

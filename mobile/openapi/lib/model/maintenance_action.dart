// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Maintenance action
enum MaintenanceAction {
  start._(r'start'),
  end._(r'end'),
  selectDatabaseRestore._(r'select_database_restore'),
  restoreDatabase._(r'restore_database'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const MaintenanceAction._(this.value);

  final String value;

  static MaintenanceAction? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

abstract class IDatabaseRepository<T> {
  /// Current version of the DB to aid with migration
  int get schemaVersion;

  /// Initializes the DB and returns the corresponding object
  T init();

  /// Check and migrate the DB to the latest schema
  void migrateDB();
}

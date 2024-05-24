import 'package:drift/drift.dart';

class LocalAlbum extends Table {
  const LocalAlbum();

  IntColumn get id => integer().autoIncrement()();
  TextColumn get localId => text()();
  TextColumn get name => text()();
  DateTimeColumn get modifiedTime =>
      dateTime().withDefault(currentDateAndTime)();
}

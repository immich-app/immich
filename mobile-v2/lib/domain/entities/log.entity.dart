import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/log.model.dart';

class Logs extends Table {
  const Logs();

  IntColumn get id => integer().autoIncrement()();
  TextColumn get content => text()();
  IntColumn get level => intEnum<LogLevel>()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  TextColumn get logger => text().nullable()();
  TextColumn get error => text().nullable()();
  TextColumn get stack => text().nullable()();
}

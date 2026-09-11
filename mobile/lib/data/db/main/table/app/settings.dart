import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/util/defaults_mixin.dart';

class SettingsEntity extends Table with DriftDefaultsMixin {
  const SettingsEntity();

  TextColumn get key => text()();

  TextColumn get value => text().nullable()();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {key};

  @override
  String get tableName => "settings";
}

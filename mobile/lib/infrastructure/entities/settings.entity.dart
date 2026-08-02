import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/datetime.converter.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class SettingsEntity extends Table with DriftDefaultsMixin {
  const SettingsEntity();

  TextColumn get key => text()();

  TextColumn get value => text().nullable()();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime).map(const DateTimeClampConverter())();

  @override
  Set<Column> get primaryKey => {key};

  @override
  String get tableName => "settings";
}

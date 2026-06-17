import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class AppMetadataEntity extends Table with DriftDefaultsMixin {
  const AppMetadataEntity();

  TextColumn get key => text()();

  TextColumn get value => text().nullable()();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {key};

  @override
  String get tableName => "app_metadata";
}

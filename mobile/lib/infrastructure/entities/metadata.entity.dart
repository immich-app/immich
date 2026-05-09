import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class MetadataEntity extends Table with DriftDefaultsMixin {
  const MetadataEntity();

  TextColumn get key => text()();

  TextColumn get value => text()();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {key};

  @override
  String get tableName => "metadata";
}

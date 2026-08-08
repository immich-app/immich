import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class PersonEntity extends Table with DriftDefaultsMixin {
  const PersonEntity();

  TextColumn get id => text()();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  TextColumn get name => text()();

  TextColumn get color => text().nullable()();

  DateTimeColumn get birthDate => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

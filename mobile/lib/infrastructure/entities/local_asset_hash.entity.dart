import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class LocalAssetHashEntity extends Table with DriftDefaultsMixin {
  const LocalAssetHashEntity();

  // Not a foreign key to assets table, as it is not guaranteed that the asset exists in the database
  TextColumn get id => text()();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  TextColumn get checksum => text()();

  @override
  Set<Column> get primaryKey => {id};
}

import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class StoreEntity extends Table with DriftDefaultsMixin {
  const StoreEntity();

  IntColumn get id => integer()();
  IntColumn get intValue => integer().nullable()();
  TextColumn get strValue => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

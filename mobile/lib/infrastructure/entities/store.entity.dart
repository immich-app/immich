import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class StoreEntity extends Table with DriftDefaultsMixin {
  IntColumn get id => integer()();

  TextColumn get stringValue => text().nullable()();
  IntColumn get intValue => integer().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
